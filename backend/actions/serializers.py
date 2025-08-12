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
        game = attrs.get('game') or (self.instance.game if self.instance else None)
        performer = attrs.get('performer') or (self.instance.performer if self.instance else None)
        action_type_slug = attrs.get('action_type') or (self.instance.action_type if self.instance else None)
        phase = attrs.get('phase')
        targets = attrs.get('targets', [])

        # Basic checks
        if not game:
            raise serializers.ValidationError("game is required")
        if not performer:
            raise serializers.ValidationError("performer is required")
        if not action_type_slug:
            raise serializers.ValidationError("action_type is required")

        # Ensure performer belongs to the same game
        if getattr(performer, 'game_id', None) != game.id:
            raise serializers.ValidationError("performer must belong to the game")

        # Load ActionType to enforce rules
        try:
            at = ActionType.objects.get(slug=action_type_slug)
        except ActionType.DoesNotExist:
            raise serializers.ValidationError(f"Unknown action_type slug: {action_type_slug}")

        cfg = at.config or {}
        tags = cfg.get('tags', [])
        separate = bool(cfg.get('separate_per_target', False))
        allow_self = bool(cfg.get('allow_self', False))
        params = cfg.get('params', [])

        # Phase check (optional but recommended)
        if phase and at.phase and phase != at.phase:
            raise serializers.ValidationError(f"This action is only available in {at.phase} phase")

        # Targets validation
        # Expect targets to be a list of { target: <gp_id>, tag?: <string> }
        if not isinstance(targets, list):
            raise serializers.ValidationError("targets must be a list")

        # For variable-count actions, we don’t know exact targets length from tags,
        # but for fixed-tag actions, enforce exact count if not 'separate' or tags empty.
        if tags and not separate:
            if len(targets) != len(tags):
                raise serializers.ValidationError(f"This action requires exactly {len(tags)} targets")

        # Validate each target record
        gp_ids = []
        for idx, t in enumerate(targets):
            if not isinstance(t, dict) or 'target' not in t:
                raise serializers.ValidationError("Each target must be an object with 'target' field")
            gp_id = t['target']
            gp_ids.append(gp_id)

            # Check tags in order for fixed-tag actions
            if tags and not separate:
                expected_tag = tags[idx]
                actual_tag = t.get('tag')
                if actual_tag and actual_tag != expected_tag:
                    raise serializers.ValidationError(f"Target #{idx+1} tag must be '{expected_tag}'")

        # Resolve GamePlayers and check membership
        from games.models import GamePlayer
        gp_qs = GamePlayer.objects.filter(id__in=gp_ids, game_id=game.id)
        if gp_qs.count() != len(gp_ids):
            raise serializers.ValidationError("All targets must be GamePlayers in the same game")

        # Disallow self-target if not allowed
        if not allow_self and any(str(x) == str(performer.id) for x in gp_ids):
            raise serializers.ValidationError("Performer cannot target themselves for this action")

        # (Optional) You can also check eliminated flag here if model has it
        # if gp_qs.filter(is_terminated=True).exists():
        #     raise serializers.ValidationError("Targets must be alive")

        return attrs

    def create(self, validated_data):
        # If you kept a legacy day_number, sync from round_number here:
        # dn = validated_data.get('round_number')
        # if dn is not None:
        #     validated_data['day_number'] = dn

        return super().create(validated_data)
