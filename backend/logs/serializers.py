from rest_framework import serializers
from .models import Log, GamePhase, DaySpeech

# === Log Serializer ===
class LogSerializer(serializers.ModelSerializer):
    # Include player name and targets as readable fields
    player_name = serializers.CharField(source="game_player.player.name", read_only=True)
    target_names = serializers.SerializerMethodField()

    class Meta:
        model = Log
        fields = [
            'id',
            'game',
            'game_player',
            'player_name',
            'action_type',
            'targets',
            'target_names',
            'phase',
            'round_number',
            'created_at'
        ]

    def get_target_names(self, obj):
        return [t.player.name for t in obj.targets.all()]

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
