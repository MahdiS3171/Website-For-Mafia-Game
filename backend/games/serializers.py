from rest_framework import serializers
from .models import Game, GamePlayer, GameRole
from players.serializers import PlayerSerializer
from roles.serializers import RoleSerializer

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['id', 'title', 'created_at', 'is_active']

class GamePlayerSerializer(serializers.ModelSerializer):
    player = PlayerSerializer(read_only=True)
    role = RoleSerializer(read_only=True)
    
    class Meta:
        model = GamePlayer
        fields = ['id', 'game', 'player', 'role', 'seat_number']

class GameRoleSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    
    class Meta:
        model = GameRole
        fields = ['id', 'game', 'role', 'count']
