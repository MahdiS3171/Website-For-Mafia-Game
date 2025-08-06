from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import Game, GamePlayer, GameRole
from .serializers import GameSerializer, GamePlayerSerializer, GameRoleSerializer

# === Game ViewSet ===
class GameViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Game.objects.all().order_by('-created_at')
    serializer_class = GameSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a game as completed and set winner side."""
        game = self.get_object()
        winner = request.data.get("winner")

        if not winner:
            return Response({"error": "Winner field is required."}, status=400)

        game.is_active = False
        game.winner = winner  # Make sure `winner` field exists in Game model
        game.save()

        return Response(self.get_serializer(game).data)


# === Game Player ViewSet (optional nested endpoint) ===
class GamePlayerViewSet(viewsets.ModelViewSet):
    queryset = GamePlayer.objects.all()
    serializer_class = GamePlayerSerializer

    def get_queryset(self):
        """Filter players by game ID if ?game= param provided."""
        queryset = super().get_queryset()
        game_id = self.request.query_params.get('game')
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        return queryset


# === Game Role ViewSet (optional nested endpoint) ===
class GameRoleViewSet(viewsets.ModelViewSet):
    queryset = GameRole.objects.all()
    serializer_class = GameRoleSerializer

    def get_queryset(self):
        """Filter roles by game ID if ?game= param provided."""
        queryset = super().get_queryset()
        game_id = self.request.query_params.get('game')
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        return queryset
