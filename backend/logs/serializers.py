from rest_framework import serializers
from .models import GamePhase, DaySpeech, Log

class GamePhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePhase
        fields = '__all__'

class DaySpeechSerializer(serializers.ModelSerializer):
    class Meta:
        model = DaySpeech
        fields = '__all__'

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = '__all__'
