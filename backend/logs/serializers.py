from rest_framework import serializers
from .models import Log, LogTarget, GamePhase, DaySpeech
from actions.models import ActionType

# === Log Serializer ===
class LogTargetSerializer(serializers.ModelSerializer):
    """Serializer for the through model representing a target and its tag."""

    player_name = serializers.CharField(source="target.player.name", read_only=True)

    class Meta:
        model = LogTarget
        fields = ['target', 'player_name', 'tag']


class LogSerializer(serializers.ModelSerializer):
    # Include player name and detailed targets (with tags)
    player_name = serializers.CharField(source="game_player.player.name", read_only=True)
    targets = LogTargetSerializer(source='log_targets', many=True)
    action_type = serializers.SlugRelatedField(
        slug_field='slug', queryset=ActionType.objects.all()
    )

    class Meta:
        model = Log
        fields = [
            'id',
            'game',
            'game_player',
            'player_name',
            'action_type',
            'targets',
            'phase',
            'round_number',
            'details',
            'created_at'
        ]

    def create(self, validated_data):
        targets_data = validated_data.pop('log_targets', [])
        log = Log.objects.create(**validated_data)
        for t_data in targets_data:
            LogTarget.objects.create(log=log, **t_data)
        return log

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
