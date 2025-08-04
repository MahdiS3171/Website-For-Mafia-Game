from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Game, GamePlayer, GameRole
from .serializers import GameSerializer, GamePlayerSerializer, GameRoleSerializer

# API for games
class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all().order_by('-created_at')
    serializer_class = GameSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a game as completed."""
        game = self.get_object()
        game.is_active = False
        game.save()
        return Response(self.get_serializer(game).data)


# API for game players
class GamePlayerViewSet(viewsets.ModelViewSet):
    queryset = GamePlayer.objects.all()
    serializer_class = GamePlayerSerializer

    def get_queryset(self):
        """Optionally filter by game ID (e.g., ?game=1)."""
        queryset = super().get_queryset()
        game_id = self.request.query_params.get('game')
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        return queryset


# API for game roles (optional, if roles are needed)
class GameRoleViewSet(viewsets.ModelViewSet):
    queryset = GameRole.objects.all()
    serializer_class = GameRoleSerializer

    def get_queryset(self):
        """Optionally filter by game ID (e.g., ?game=1)."""
        queryset = super().get_queryset()
        game_id = self.request.query_params.get('game')
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        return queryset
