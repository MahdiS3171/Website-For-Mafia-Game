from rest_framework import serializers
from .models import Log, LogTarget, GamePhase, DaySpeech, DayTurn
from actions.models import ActionType
from rest_framework import serializers as drf


class DayTurnSerializer(drf.ModelSerializer):
    actor_name = drf.CharField(source='actor.player.name', read_only=True)

    class Meta:
        model = DayTurn
        fields = ['id', 'game', 'round_number', 'index', 'actor', 'actor_name', 'opened_at', 'closed_at']
        read_only_fields = ['index', 'opened_at', 'closed_at']


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
    
    turn_index = serializers.IntegerField(source='day_turn.index', read_only=True)
    turn_actor_name = serializers.CharField(source='day_turn.actor.player.name', read_only=True)

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
            'day_turn',
            'turn_index',
            'turn_actor_name',
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
            
        dt_id = (self.initial_data or {}).get('day_turn')
        if dt_id:
            try:
                dt = DayTurn.objects.get(pk=dt_id)
            except DayTurn.DoesNotExist:
                raise drf.ValidationError("Invalid day_turn id")
            if dt.game_id != game.id or dt.round_number != attrs.get('round_number'):
                raise drf.ValidationError("day_turn must match this game and current day")
            if dt.closed_at:
                raise drf.ValidationError("day_turn is already closed")
            # enforce: logs in a turn must be by the actor of that turn
            if str(dt.actor_id) != str(getattr(performer, 'id', None)):
                raise drf.ValidationError("This turn belongs to another actor")
            attrs['day_turn'] = dt

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

        # --- Claim / Will / Defense details (final) ---
        if isinstance(details_schema, dict):
            from rest_framework import serializers as drf
            from games.models import GamePlayer

            # Helpers
            def _as_id_list(val):
                """
                Normalize a possibly-empty single value or list/tuple into a list of ints.
                Accepts '', None -> [].
                """
                if val is None:
                    return []
                if isinstance(val, (list, tuple)):
                    out = []
                    for v in val:
                        s = str(v).strip()
                        if not s:
                            continue
                        try:
                            out.append(int(s))
                        except ValueError:
                            raise drf.ValidationError("IDs must be integers")
                    return out
                s = str(val).strip()
                if not s:
                    return []
                try:
                    return [int(s)]
                except ValueError:
                    raise drf.ValidationError("IDs must be integers")

            def _validate_player_ids(id_list, fieldname):
                """Ensure all ids belong to this game."""
                if not id_list:
                    return
                qs = GamePlayer.objects.filter(id__in=id_list, game_id=game.id)
                if qs.count() != len(set(id_list)):
                    raise drf.ValidationError(f"Some {fieldname} are not players in this game")

            # Build allowed role keys (slugs/names) from roles present in *this* game.
            # Works whether GamePlayer.role is a FK to Role or a CharField.
            allowed_role_keys = set()       # lowercase keys
            canonical_by_lower = {}         # lower -> canonical slug/name

            try:
                # Prefer Role model if available and linked via GamePlayer
                from roles.models import Role  # type: ignore
                roles_qs = Role.objects.filter(gameplayer__game_id=game.id).distinct()
                for row in roles_qs.values('slug', 'name'):
                    for key in (row.get('slug'), row.get('name')):
                        if key:
                            lower = str(key).lower()
                            allowed_role_keys.add(lower)
                            # Prefer slug as canonical if present, else name
                            canonical_by_lower.setdefault(lower, row.get('slug') or row.get('name'))
            except Exception:
                # Fallback: derive from players' role field (string)
                for val in (GamePlayer.objects
                            .filter(game_id=game.id)
                            .values_list('role', flat=True)
                            .distinct()):
                    if val:
                        sval = str(val)
                        lower = sval.lower()
                        allowed_role_keys.add(lower)
                        canonical_by_lower.setdefault(lower, sval)

            # -------- CLAIM (role only) ----------
            # If schema marks role_slug as required, enforce it and canonicalize
            role_req = bool(details_schema.get('role_slug', {}).get('required', False))
            if role_req and (attrs.get('action_type') == 'claim' or at.slug == 'claim' or True):
                role_val = details.get('role_slug') or details.get('role')
                if not role_val or not str(role_val).strip():
                    raise drf.ValidationError("role_slug is required for this action")
                key = str(role_val).lower()
                if allowed_role_keys and key not in allowed_role_keys:
                    raise drf.ValidationError("role_slug must be one of the roles present in this game")
                # Canonicalize (prefer slug if we had it)
                details['role_slug'] = canonical_by_lower.get(key, str(role_val))
                attrs['details'] = details

            # -------- WILL (many targets, many covers, optional claim role) ----------
            # We allow empty WILL logs. Accept both single values and arrays.
            if any(k in details_schema for k in ('target', 'targets', 'cover', 'covers', 'claim_role', 'will_claim_role')):
                # normalize to lists
                will_targets = []
                will_covers = []

                # accept multiple possible keys from UI/schema
                for k in ('will_targets', 'targets', 'target'):
                    if k in details:
                        will_targets = _as_id_list(details.get(k))
                        break
                for k in ('will_covers', 'covers', 'cover'):
                    if k in details:
                        will_covers = _as_id_list(details.get(k))
                        break

                # validate player membership (but allow empty lists)
                _validate_player_ids(will_targets, "will targets")
                _validate_player_ids(will_covers, "will covers")

                # optional role in will, validate like Claim
                will_role = details.get('will_claim_role') or details.get('claim_role')
                if will_role and str(will_role).strip():
                    key = str(will_role).lower()
                    if allowed_role_keys and key not in allowed_role_keys:
                        raise drf.ValidationError("claim_role in will must be a role present in this game")
                    details['claim_role'] = canonical_by_lower.get(key, str(will_role))
                else:
                    # normalize empties
                    details['claim_role'] = None

                # store canonical arrays, even if empty (allowed)
                details['targets'] = will_targets
                details['covers'] = will_covers
                attrs['details'] = details

            # -------- DEFENSE (three parts, like will) ----------
            # Expect optional: coverer (single), defense_targets (list), defense_covered (list).
            # Allow multiple key aliases for flexibility.
            if any(k in details_schema for k in ('defense_coverer', 'coverer', 'defense_targets', 'defense_covered')):
                # Single coverer
                coverer = None
                for k in ('defense_coverer', 'coverer'):
                    if k in details:
                        ids = _as_id_list(details.get(k))
                        coverer = ids[0] if ids else None
                        break
                if coverer is not None:
                    _validate_player_ids([coverer], "defense coverer")

                # Targets (list)
                defense_targets = []
                for k in ('defense_targets', 'targets'):
                    if k in details:
                        defense_targets = _as_id_list(details.get(k))
                        break
                _validate_player_ids(defense_targets, "defense targets")

                # Covered (list)
                defense_covered = []
                for k in ('defense_covered', 'covered'):
                    if k in details:
                        defense_covered = _as_id_list(details.get(k))
                        break
                _validate_player_ids(defense_covered, "defense covered players")

                # Save normalized shapes (empties allowed)
                details['defense_coverer'] = coverer
                details['defense_targets'] = defense_targets
                details['defense_covered'] = defense_covered
                attrs['details'] = details
        # --- end Claim / Will / Defense details ---


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
