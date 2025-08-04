from rest_framework import serializers
from .models import GamePhase, DaySpeech

class GamePhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePhase
        fields = ['id', 'game', 'phase_type', 'number']

class DaySpeechSerializer(serializers.ModelSerializer):
    class Meta:
        model = DaySpeech
        fields = ['id', 'phase', 'speaker', 'order', 'content']
