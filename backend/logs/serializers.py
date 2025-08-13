from rest_framework import serializers
from .models import Log, LogTarget, GamePhase, DaySpeech
from actions.models import ActionType


# === LogTarget Serializer ===
class LogTargetSerializer(serializers.ModelSerializer):
    # read-only convenience for reads
    player_name = serializers.CharField(source='target.player.name', read_only=True)

    class Meta:
        model = LogTarget
        fields = ['id', 'target', 'tag', 'player_name']


# === Log Serializer ===
class LogSerializer(serializers.ModelSerializer):
    # NOTE: field name "targets" maps to model field "log_targets"
    targets = LogTargetSerializer(many=True, source='log_targets', required=False)
    player_name = serializers.CharField(source='game_player.player.name', read_only=True)

    # DRF will deserialize this to an ActionType INSTANCE (because queryset is set)
    action_type = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=ActionType.objects.all()
    )

    class Meta:
        model = Log
        fields = [
            'id',
            'game',
            'game_player',
            'player_name',
            'action_type',   # ActionType instance via SlugRelatedField
            'targets',       # exposed name (source='log_targets')
            'phase',
            'round_number',
            'details',
            'created_at',
        ]
        read_only_fields = ('created_at', 'player_name')

    def create(self, validated_data):
        # Extract nested targets using the *source* key
        targets_data = validated_data.pop('log_targets', [])
        log = Log.objects.create(**validated_data)
        for t in targets_data:
            # DRF already deserializes 'target' to a GamePlayer instance for ModelSerializer
            LogTarget.objects.create(log=log, **t)
        return log

    def update(self, instance, validated_data):
        targets_data = validated_data.pop('log_targets', None)
        instance = super().update(instance, validated_data)
        if targets_data is not None:
            instance.log_targets.all().delete()
            for t in targets_data:
                LogTarget.objects.create(log=instance, **t)
        return instance

    def validate(self, attrs):
        """
        Accepts:
          - game (Game)
          - game_player (GamePlayer)  [alias 'performer' also allowed in input]
          - action_type (slug) -> DRF gives us an ActionType INSTANCE here
          - phase ('day'|'night')
          - log_targets/targets: [{target: <GamePlayer|id|str|dict>, tag?: <str>}]
          - details: dict (optional)

        Robust behavior:
          - Resolve action_type if it isn't an instance (accept slug/id/name)
          - Derive details['n'] = len(targets) for vote actions (first/second vote or config flag)
          - Never require client 'n' for votes
          - Coerce each targets[].target into an INT id for membership checks
        """
        from games.models import GamePlayer as GPModel
        from rest_framework import serializers as drf

        # tolerate alternate key names on input
        game = attrs.get('game') or (self.instance.game if self.instance else None)
        performer = (
            attrs.get('performer')
            or attrs.get('game_player')
            or (self.instance.game_player if self.instance else None)
        )
        action_type_val = attrs.get('action_type') or (self.instance.action_type if self.instance else None)
        phase = attrs.get('phase')
        # prefer source key ('log_targets'); fallback to exposed name ('targets') if ever present
        targets = attrs.get('log_targets', attrs.get('targets', []))
        details = attrs.get('details') or {}

        # basic guards
        if not game:
            raise drf.ValidationError("game is required")
        if not performer:
            raise drf.ValidationError("performer is required")
        if not action_type_val:
            raise drf.ValidationError("action_type is required")

        if getattr(performer, 'game_id', None) != game.id:
            raise drf.ValidationError("performer must belong to the game")

        # ---- Normalize/resolve ActionType ----
        # If DRF has already converted it, it's an instance; keep it that way.
        if isinstance(action_type_val, ActionType):
            at = action_type_val
        else:
            # be permissive if something else posts raw slug/id/name
            at = ActionType.objects.filter(slug=action_type_val).first()
            if at is None:
                try:
                    at = ActionType.objects.get(pk=action_type_val)
                except Exception:
                    at = ActionType.objects.filter(name__iexact=str(action_type_val)).first()
            if at is None:
                raise drf.ValidationError(f"Unknown action_type: {action_type_val}")
            attrs['action_type'] = at  # set the instance back so create() gets an instance

        cfg = at.config or {}

        # normalize tags: ['target'] or [{'key','label'}]
        raw_tags = cfg.get('tags') or []
        norm_tags = (
            [{'key': t, 'label': t.title()} for t in raw_tags]
            if raw_tags and isinstance(raw_tags[0], str) else raw_tags
        )
        tag_keys_in_order = [t.get('key') for t in norm_tags if isinstance(t, dict)]

        separate = bool(cfg.get('separate_per_target', cfg.get('separatePerTarget', False)))
        allow_self = bool(cfg.get('allow_self', False))
        params_spec = dict(cfg.get('params') or {})  # copy; we may mutate
        requires_targets = cfg.get('requires_targets', bool(norm_tags) or bool(params_spec))
        details_schema = cfg.get('details_schema') or {}

        # vote detection
        is_vote = bool(cfg.get('derive_n_from_targets', False)) or at.slug in ("first_vote", "second_vote")

        # phase guard
        if phase and at.phase and phase != at.phase:
            raise drf.ValidationError(f"This action is only available in {at.phase} phase")

        # targets must be a list (post-deserialize: list[dict])
        if not isinstance(targets, list):
            raise drf.ValidationError("targets must be a list")

        # ---- Derive n early for votes; ignore any params_spec['n'] for votes
        if is_vote:
            computed_n = len(targets)
            if computed_n < 1:
                raise drf.ValidationError("At least one voter is required")
            details['n'] = computed_n
            attrs['details'] = details
            params_spec.pop('n', None)

        # params (k-of-n)
        k = details.get('k')
        n = details.get('n')

        if 'k' in params_spec:
            if k is None or not isinstance(k, int) or (params_spec['k'].get('min') and k < params_spec['k']['min']):
                raise drf.ValidationError("Missing/invalid 'k' for this action")

        if 'n' in params_spec:
            if n is None or not isinstance(n, int) or (params_spec['n'].get('min') and n < params_spec['n']['min']):
                raise drf.ValidationError("Missing/invalid 'n' for this action")

        if (k is not None) and (n is not None) and 'n' in params_spec:
            if not (1 <= k <= n):
                raise drf.ValidationError("'k' must be between 1 and 'n'")

        # ---- Validate/collect target ids robustly ----
        def coerce_gp_id(raw):
            """Return an int GamePlayer id from many possible shapes."""
            # int already
            if isinstance(raw, int):
                return raw
            # numeric str
            if isinstance(raw, str):
                try:
                    return int(raw)
                except ValueError:
                    pass
            # DRF may already have given us a GamePlayer instance
            if isinstance(raw, GPModel):
                return int(raw.pk)
            # dict-like holding an id
            if isinstance(raw, dict):
                for key in ("id", "pk", "value"):
                    if key in raw:
                        return coerce_gp_id(raw[key])
            raise drf.ValidationError("Each target.target must be a GamePlayer id (int)")

        gp_ids = []

        if requires_targets:
            if tag_keys_in_order and not separate:
                if len(targets) != len(tag_keys_in_order):
                    raise drf.ValidationError(f"This action requires exactly {len(tag_keys_in_order)} targets")
            elif not tag_keys_in_order:
                if 'n' in params_spec:
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

                gp_id = coerce_gp_id(t['target'])
                gp_ids.append(gp_id)

                if tag_keys_in_order and not separate:
                    expected_tag = tag_keys_in_order[idx]
                    actual_tag = t.get('tag')
                    if actual_tag != expected_tag:
                        raise drf.ValidationError(f"Target #{idx+1} tag must be '{expected_tag}'")
        else:
            if targets:
                raise drf.ValidationError("This action does not accept targets")

        # ---- Resolve ids & same-game check (now all gp_ids are ints) ----
        if gp_ids:
            qs = GPModel.objects.filter(id__in=gp_ids, game_id=game.id)
            if qs.count() != len(gp_ids):
                raise drf.ValidationError("All targets must be GamePlayers in the same game")
            # Optional: ensure alive here if your model supports it
            # if qs.filter(is_eliminated=True).exists():
            #     raise drf.ValidationError("Targets must be alive")

        # self-targeting guard
        if not allow_self and any(int(gid) == int(performer.id) for gid in gp_ids):
            raise drf.ValidationError("Performer cannot target themselves for this action")

        # ---- Claim / Will / Defense-extended checks ----
        def _coerce_id(val):
            if isinstance(val, int):
                return val
            if isinstance(val, str):
                try:
                    return int(val)
                except ValueError:
                    pass
            if isinstance(val, GPModel):
                return int(val.pk)
            if isinstance(val, dict):
                for key in ("id", "pk", "value"):
                    if key in val:
                        return _coerce_id(val[key])
            raise drf.ValidationError("Expected a GamePlayer id")

        def _coerce_id_list(val):
            if val is None or val == "":
                return []
            if isinstance(val, (list, tuple)):
                return [ _coerce_id(x) for x in val ]
            # single value -> wrap
            return [ _coerce_id(val) ]

        if isinstance(details_schema, dict):
            # Claim: role must be present and one of game roles
            role_req = details_schema.get('role_slug', {}).get('required', False)
            if role_req:
                role_val = details.get('role_slug') or details.get('role')
                if not role_val:
                    raise drf.ValidationError("role_slug is required for this action")
                allowed = list(
                    GPModel.objects.filter(game_id=game.id)
                    .exclude(role__isnull=True).exclude(role__exact="")
                    .values_list('role', flat=True).distinct()
                )
                if allowed and not any(str(role_val).lower() == str(r).lower() for r in allowed):
                    raise drf.ValidationError(
                        f"role_slug must be one of the game roles: {', '.join(sorted(set(map(str, allowed))))}"
                    )
                details['role_slug'] = role_val
                attrs['details'] = details

            # Will: allow multi targets/covers + optional claim_role
            will_keys = [k for k in ('target', 'cover', 'claim_role') if k in details_schema]
            if will_keys:
                t_list = _coerce_id_list(details.get('target'))
                c_list = _coerce_id_list(details.get('cover'))
                # Optional membership checks
                if t_list:
                    qs = GPModel.objects.filter(id__in=t_list, game_id=game.id)
                    if qs.count() != len(t_list):
                        raise drf.ValidationError("Will.target contains invalid players")
                if c_list:
                    qs = GPModel.objects.filter(id__in=c_list, game_id=game.id)
                    if qs.count() != len(c_list):
                        raise drf.ValidationError("Will.cover contains invalid players")
                details['target'] = t_list
                details['cover'] = c_list
                
                # Optional pruning (keeps details compact)
                if not t_list:
                    details.pop('target', None)
                if not c_list:
                    details.pop('cover', None)
                if not details.get('claim_role'):
                    details.pop('claim_role', None)
                    
                attrs['details'] = details

            # Defense extended: coverer (single), targets (multi), covered (multi)
            if any(k in details_schema for k in ('coverer', 'targets', 'covered')):
                if 'coverer' in details_schema and details.get('coverer'):
                    details['coverer'] = _coerce_id(details['coverer'])
                    if not GPModel.objects.filter(id=details['coverer'], game_id=game.id).exists():
                        raise drf.ValidationError("Defense.coverer must be a player in this game")
                if 'targets' in details_schema and details.get('targets') is not None:
                    tlist = _coerce_id_list(details.get('targets'))
                    if tlist:
                        qs = GPModel.objects.filter(id__in=tlist, game_id=game.id)
                        if qs.count() != len(tlist):
                            raise drf.ValidationError("Defense.targets contains invalid players")
                    details['targets'] = tlist
                if 'covered' in details_schema and details.get('covered') is not None:
                    clist = _coerce_id_list(details.get('covered'))
                    if clist:
                        qs = GPModel.objects.filter(id__in=clist, game_id=game.id)
                        if qs.count() != len(clist):
                            raise drf.ValidationError("Defense.covered contains invalid players")
                    details['covered'] = clist
                attrs['details'] = details

        return attrs


# === Game Phase Serializer ===
class GamePhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePhase
        fields = ['id', 'game', 'phase_type', 'number']


# === Day Speech Serializer ===
class DaySpeechSerializer(serializers.ModelSerializer):
    class Meta:
        model = DaySpeech
        fields = ['id', 'phase', 'speaker', 'order', 'content']
