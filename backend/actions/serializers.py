# actions/serializers.py
from rest_framework import serializers
from .models import Action, ActionType

class ActionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionType
        fields = ['id','name','slug','phase','config']

class ActionSerializer(serializers.ModelSerializer):
    # ensure we accept these fields from the frontend
    phase = serializers.CharField(required=False, allow_null=True)
    round_number = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Action
        fields = [
            'id', 'game', 'action_type', 'performer',
            'round_number', 'phase',
            'targets', 'details', 'created_at'
        ]

    def validate(self, attrs):
        """
        Expected input fields:
        - game (Game), performer (GamePlayer), action_type (slug), phase ('day'|'night')
        - targets: [{ target: <GamePlayer.id>, tag?: <str> }]
        - details: dict (optional)
        """
        from actions.models import ActionType
        from games.models import GamePlayer
        from rest_framework import serializers as drf  # alias

        game = attrs.get('game') or (self.instance.game if self.instance else None)
        performer = attrs.get('performer') or (self.instance.performer if self.instance else None)
        action_type_slug = attrs.get('action_type') or (self.instance.action_type if self.instance else None)
        phase = attrs.get('phase')
        targets = attrs.get('targets', [])
        details = attrs.get('details') or {}

        # ----- Basic checks -----
        if not game:
            raise drf.ValidationError("game is required")
        if not performer:
            raise drf.ValidationError("performer is required")
        if not action_type_slug:
            raise drf.ValidationError("action_type is required")

        if getattr(performer, 'game_id', None) != game.id:
            raise drf.ValidationError("performer must belong to the game")

        # ----- Load ActionType -----
        try:
            at = ActionType.objects.get(slug=action_type_slug)
        except ActionType.DoesNotExist:
            raise drf.ValidationError(f"Unknown action_type slug: {action_type_slug}")

        cfg = at.config or {}

        # Normalize tags: ['target', ...] or [{'key','label'}, ...]
        raw_tags = cfg.get('tags') or []
        norm_tags = (
            [{'key': t, 'label': t.title()} for t in raw_tags]
            if raw_tags and isinstance(raw_tags[0], str) else raw_tags
        )
        tag_keys_in_order = [t.get('key') for t in norm_tags if isinstance(t, dict)]

        separate = bool(cfg.get('separate_per_target', cfg.get('separatePerTarget', False)))
        allow_self = bool(cfg.get('allow_self', False))
        params_spec = dict(cfg.get('params') or {})  # copy, we may mutate
        requires_targets = cfg.get('requires_targets', bool(norm_tags) or bool(params_spec))
        details_schema = cfg.get('details_schema') or {}

        # Votes: config flag OR by slug
        derive_n_from_targets = bool(cfg.get('derive_n_from_targets', False)) or action_type_slug in ("first_vote", "second_vote")

        # ----- Phase guard -----
        # if phase and at.phase and phase != at.phase:
        #     raise drf.ValidationError(f"This action is only available in {at.phase} phase")

        # ----- Targets container must be a list -----
        if not isinstance(targets, list):
            raise drf.ValidationError("targets must be a list")

        # ----- Derive n early for votes & relax params -----
        # This guarantees we never fail later on "Missing/invalid 'n'" for votes.
        if derive_n_from_targets:
            computed_n = len(targets)
            if computed_n < 1:
                raise drf.ValidationError("At least one voter is required")
            details['n'] = computed_n
            attrs['details'] = details
            # Strip any lingering 'n' requirement from params to avoid false negatives
            if 'n' in params_spec:
                params_spec.pop('n', None)

        # ----- Params (k-of-n) -----
        k = details.get('k')
        n = details.get('n')

        if 'k' in params_spec:
            if k is None or not isinstance(k, int) or (params_spec['k'].get('min') and k < params_spec['k']['min']):
                raise drf.ValidationError("Missing/invalid 'k' for this action")

        # Only enforce 'n' when not a vote (we removed from params_spec above for votes)
        if 'n' in params_spec:
            if n is None or not isinstance(n, int) or (params_spec['n'].get('min') and n < params_spec['n']['min']):
                raise drf.ValidationError("Missing/invalid 'n' for this action")

        if (k is not None) and (n is not None) and 'n' in params_spec:
            if not (1 <= k <= n):
                raise drf.ValidationError("'k' must be between 1 and 'n'")

        # ----- Validate targets (fixed tags vs variable length) -----
        gp_ids = []
        if requires_targets:
            if tag_keys_in_order and not separate:
                if len(targets) != len(tag_keys_in_order):
                    raise drf.ValidationError(f"This action requires exactly {len(tag_keys_in_order)} targets")
            elif not tag_keys_in_order:
                # variable-length list (siding / votes / generic multi-pick)
                if 'n' in params_spec:
                    # classic n-controlled selection
                    if not isinstance(n, int):
                        raise drf.ValidationError("details.n is required and must be an integer")
                    if len(targets) != n:
                        raise drf.ValidationError(f"Exactly {n} targets required")
                else:
                    if len(targets) < 1:
                        raise drf.ValidationError("At least one target is required")

            for idx, t in enumerate(targets):
                if not isinstance(t, dict) or 'target' not in t:
                    raise drf.ValidationError("Each target must be an object with 'target' field")
                gp_id = t['target']
                gp_ids.append(gp_id)

                if tag_keys_in_order and not separate:
                    expected_tag = tag_keys_in_order[idx]
                    actual_tag = t.get('tag')
                    if actual_tag != expected_tag:
                        raise drf.ValidationError(f"Target #{idx+1} tag must be '{expected_tag}'")
        else:
            if targets:
                raise drf.ValidationError("This action does not accept targets")

        # ----- Resolve targets & same-game check -----
        if gp_ids:
            qs = GamePlayer.objects.filter(id__in=gp_ids, game_id=game.id)
            if qs.count() != len(gp_ids):
                raise drf.ValidationError("All targets must be GamePlayers in the same game")
            # Optional alive rule:
            # if qs.filter(is_eliminated=True).exists():
            #     raise drf.ValidationError("Targets must be alive")

        # ----- Self-targeting guard -----
        if not allow_self and any(str(gid) == str(performer.id) for gid in gp_ids):
            raise drf.ValidationError("Performer cannot target themselves for this action")

        # ----- Claim / Will -----
        if isinstance(details_schema, dict):
            # Claim: must have role from roles present in the game
            role_req = details_schema.get('role_slug', {}).get('required', False)
            if role_req:
                role_val = details.get('role_slug') or details.get('role')
                if not role_val:
                    raise drf.ValidationError("role_slug is required for this action")
                allowed = list(
                    GamePlayer.objects.filter(game_id=game.id)
                    .exclude(role__isnull=True).exclude(role__exact="")
                    .values_list('role', flat=True).distinct()
                )
                if allowed and not any(str(role_val).lower() == str(r).lower() for r in allowed):
                    raise drf.ValidationError(
                        f"role_slug must be one of the game roles: {', '.join(sorted(set(map(str, allowed))))}"
                    )
                details['role_slug'] = role_val
                attrs['details'] = details

            # Will: require at least one of target/cover/claim_role if present in schema
            will_keys = [k for k in ('target', 'cover', 'claim_role') if k in details_schema]
            if will_keys and not any(details.get(k) for k in will_keys):
                raise drf.ValidationError(
                    f"At least one of {', '.join(will_keys)} must be provided for this action"
                )

        return attrs




    def create(self, validated_data):
        # If you kept a legacy day_number, sync from round_number here:
        # dn = validated_data.get('round_number')
        # if dn is not None:
        #     validated_data['day_number'] = dn

        return super().create(validated_data)
