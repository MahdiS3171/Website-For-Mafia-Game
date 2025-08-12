from rest_framework import serializers
from .models import Log, LogTarget, GamePhase, DaySpeech
from actions.models import ActionType

# === Log Serializer ===
class LogTargetSerializer(serializers.ModelSerializer):
    # if you expose player_name in reads, you can keep it read_only
    player_name = serializers.CharField(source='target.player.name', read_only=True)

    class Meta:
        model = LogTarget
        fields = ['id', 'target', 'tag', 'player_name']


class LogSerializer(serializers.ModelSerializer):
    # IMPORTANT:
    # source='log_targets' must match the related_name on LogTarget.log FK
    targets = LogTargetSerializer(many=True, source='log_targets', required=False)
    player_name = serializers.CharField(source='game_player.player.name', read_only=True)
    
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
            'player_name',     # if you had this computed/read_only, keep it
            'action_type',
            'targets',         # exposed name
            'phase',
            'round_number',
            'details',
            'created_at',
        ]
        read_only_fields = ('created_at', 'player_name')

    def create(self, validated_data):
        # Extract nested targets (using the *source* key)
        targets_data = validated_data.pop('log_targets', [])
        # Create the log first
        log = Log.objects.create(**validated_data)
        # Create each target row
        for t in targets_data:
            # t is a dict like {'target': <gp_id>, 'tag': 'guard'}
            LogTarget.objects.create(log=log, **t)
        return log

    def update(self, instance, validated_data):
        # Optional, only if you support updates with nested targets
        targets_data = validated_data.pop('log_targets', None)
        instance = super().update(instance, validated_data)
        if targets_data is not None:
            instance.log_targets.all().delete()
            for t in targets_data:
                LogTarget.objects.create(log=instance, **t)
        return instance

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
