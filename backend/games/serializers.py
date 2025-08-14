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

# class GameSerializer(serializers.ModelSerializer):
#     date = serializers.DateTimeField(source='created_at', read_only=True)
#     status = serializers.SerializerMethodField()
#     players = PlayerSerializer(source='gameplayer_set', many=True, read_only=True)
#     current_phase = serializers.CharField(read_only=True)
#     round_number = serializers.IntegerField(read_only=True)

#     class Meta:
#         model = Game
#         fields = ['id', 'title', 'date', 'status', 'is_active', 'winner', 'current_phase', 'round_number', 'players']  # include winner

#     def get_status(self, obj):
#         return "in-progress" if obj.is_active else "completed"

from rest_framework import serializers
from .models import Game, GamePlayer

class GamePlayerSerializer(serializers.ModelSerializer):
    player_id = serializers.IntegerField(source='player.id', read_only=True)
    name = serializers.CharField(source='player.name', read_only=True)
    nickname = serializers.CharField(source='player.nickname', allow_null=True, read_only=True)
    role = serializers.CharField(source='role.name', allow_null=True, read_only=True)
    role_slug = serializers.CharField(source='role.slug', allow_null=True, read_only=True)
    is_eliminated = serializers.SerializerMethodField()

    class Meta:
        model = GamePlayer
        fields = [
            'id', 'player_id', 'name', 'nickname',
            'seat_number', 'role', 'role_slug',
            'is_eliminated',
        ]

    def get_is_eliminated(self, obj):
        if hasattr(obj, 'isterminated'):
            return bool(obj.isterminated)
        if hasattr(obj, 'is_alive'):
            return not bool(obj.is_alive)
        if hasattr(obj, 'eliminated_at'):
            return obj.eliminated_at is not None
        return False

class GameSerializer(serializers.ModelSerializer):
    players = GamePlayerSerializer(source='gameplayer_set', many=True, read_only=True)
    is_active = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    winner = serializers.SerializerMethodField()  # <- ADD: computed winner

    class Meta:
        model = Game
        fields = [
            'id', 'title', 'current_phase', 'round_number',
            'created_at', 'ended_at', 'players', 'is_active', 'date', 'winner'
        ]

    def get_is_active(self, obj):
        return obj.ended_at is None

    def get_date(self, obj):
        return obj.created_at.date()

    def get_winner(self, obj):
        """
        Only expose winner for completed games.
        Read from multiple possible locations for robustness.
        """
        # Gate on completion
        if obj.ended_at is None:
            return None

        # Try common places
        side = (
            getattr(obj, "winner", None) or
            getattr(obj, "winner_side", None) or
            getattr(obj, "winning_side", None)
        )

        # Fallback to a related result object, if you have one
        # (adjust attribute name if yours is different)
        if not side:
            result = (
                getattr(obj, "result", None) or
                getattr(obj, "game_result", None) or
                getattr(obj, "gameresult", None)
            )
            if result:
                side = getattr(result, "winner", None) or getattr(result, "winner_side", None)

        return side or None


class GameRoleSerializer(serializers.ModelSerializer):
    players = GamePlayerSerializer(source='gameplayer_set', many=True, read_only=True)
    class Meta:
        model = GameRole
        fields = ['id', 'game', 'role', 'count']
