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

class GamePlayerSerializer(serializers.ModelSerializer):
    player_id = serializers.IntegerField(source='player.id')
    name = serializers.CharField(source='player.name')
    nickname = serializers.CharField(source='player.nickname', allow_null=True)
    role = serializers.CharField(source='role.name', allow_null=True)
    role_slug = serializers.CharField(source='role.slug', allow_null=True)
    is_eliminated = serializers.SerializerMethodField()

    class Meta:
        model = GamePlayer
        fields = ['id','player_id','name','nickname','seat_number','role','role_slug','is_eliminated']

    def get_is_eliminated(self, obj):
        # Just return the boolean
        return getattr(obj, 'isterminated', False)

class GameSerializer(serializers.ModelSerializer):
    players = GamePlayerSerializer(source='gameplayer_set', many=True, read_only=True)
    class Meta:
        model = Game
        fields = ['id','title','current_phase','round_number','players']


class GameRoleSerializer(serializers.ModelSerializer):
    players = GamePlayerSerializer(source='gameplayer_set', many=True, read_only=True)
    class Meta:
        model = GameRole
        fields = ['id', 'game', 'role', 'count']
