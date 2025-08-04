from rest_framework import serializers
from .models import Game, GamePlayer, GameRole
from players.models import Player

# === Player Serializer (nested inside Game) ===
class PlayerSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='player.name')  # show player's name
    role = serializers.CharField(source='role.name', required=False)  # role name if assigned

    class Meta:
        model = GamePlayer
        fields = ['id', 'name', 'role', 'seat_number']

# === Game Serializer ===
class GameSerializer(serializers.ModelSerializer):
    # Map fields for frontend expectations
    date = serializers.DateTimeField(source='created_at', read_only=True)
    status = serializers.SerializerMethodField()
    players = PlayerSerializer(source='gameplayer_set', many=True, read_only=True)

    class Meta:
        model = Game
        fields = ['id', 'date', 'status', 'is_active', 'players']

    def get_status(self, obj):
        return "in-progress" if obj.is_active else "completed"

# === Game Player Serializer ===
class GamePlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePlayer
        fields = ['id', 'game', 'player', 'role', 'seat_number']

# === Game Role Serializer (if needed) ===
class GameRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameRole
        fields = ['id', 'game', 'role', 'count']
