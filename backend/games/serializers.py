# games/serializers.py
from rest_framework import serializers
from .models import Game, GamePlayer, GameRole

# Nested Player inside Game
class PlayerSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='player.name')  # player's name
    role = serializers.CharField(source='role.name', required=False)  # role name if assigned

    class Meta:
        model = GamePlayer
        fields = ['id', 'name', 'role', 'seat_number']

class GameSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source='created_at', read_only=True)
    status = serializers.SerializerMethodField()
    players = PlayerSerializer(source='gameplayer_set', many=True, read_only=True)

    class Meta:
        model = Game
        fields = ['id', 'date', 'status', 'is_active', 'winner', 'players']  # include winner

    def get_status(self, obj):
        return "in-progress" if obj.is_active else "completed"

class GamePlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePlayer
        fields = ['id', 'game', 'player', 'role', 'seat_number']


class GameRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameRole
        fields = ['id', 'game', 'role', 'count']
