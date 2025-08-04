from rest_framework import serializers
from .models import Game, GamePlayer, GameRole

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['id', 'created_at', 'is_active']

class GamePlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePlayer
        fields = ['id', 'game', 'player', 'role', 'seat_number']

class GameRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameRole
        fields = ['id', 'game', 'role', 'count']
