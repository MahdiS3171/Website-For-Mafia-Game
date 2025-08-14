from rest_framework import serializers
from .models import Player

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'name', 'nickname', 'created_at']
        read_only_fields = ["created_at"]
        
class PlayerWithStatsSerializer(PlayerSerializer):
    games_played = serializers.IntegerField(read_only=True)
    wins = serializers.IntegerField(read_only=True)
    win_rate = serializers.FloatField(read_only=True)

    class Meta(PlayerSerializer.Meta):
        fields = PlayerSerializer.Meta.fields + ["games_played", "wins", "win_rate"]
