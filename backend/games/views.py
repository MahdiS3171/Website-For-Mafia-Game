from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser , AllowAny
from .models import Game, GamePlayer, GameRole
from .serializers import GameSerializer, GamePlayerSerializer, GameRoleSerializer
from rest_framework import status, viewsets
from django.db import transaction
from players.models import Player
from roles.models import Role

# === Game ViewSet ===
class GameViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
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


    @action(detail=True, methods=['post'])
    def advance_phase(self, request, pk=None):
        """Toggle day/night; increment round when back to day; create a GamePhase."""
        from logs.models import GamePhase
        game = self.get_object()
        if game.current_phase == 'day':
            game.current_phase = 'night'
        else:
            game.current_phase = 'day'
            game.round_number += 1
        game.save()
        GamePhase.objects.create(game=game, phase_type=game.current_phase, number=game.round_number)
        return Response(self.get_serializer(game).data)

    @action(detail=True, methods=['post'])
    def terminate_players(self, request, pk=None):
        game = self.get_object()
        ids = request.data  # ["12", "18"]
        if not isinstance(ids, list) or not ids:
            return Response({"error": "Provide a non-empty array"}, status=400)

        qs = game.gameplayer_set.filter(id__in=ids)
        updated = qs.update(isterminated=True)  # <--- update the boolean
        return Response({"ok": True, "updated": updated})
    
    @action(detail=True, methods=['post'])
    def bulk_add_players(self, request, pk=None):
        game = self.get_object()
        data = request.data
        if not isinstance(data, list) or not data:
            return Response({"error": "Body must be a non-empty array"}, status=400)

        seat_numbers = [row.get("seat_number") for row in data]
        if len(seat_numbers) != len(set(seat_numbers)):
            return Response({"error": "Duplicate seat_number found"}, status=400)

        try:
            with transaction.atomic():
                for row in data:
                    name = (row.get("name") or "").strip()
                    nickname = (row.get("nickname") or "").strip()
                    seat = row.get("seat_number")
                    role_slug = row.get("role_slug")
                    player_id = row.get("player_id")

                    if not seat or not role_slug:
                        raise ValueError("seat_number and role_slug are required")

                    role = Role.objects.filter(slug=role_slug).first()
                    if not role:
                        raise ValueError(f"Role not found for slug: {role_slug}")

                    if player_id:
                        player = Player.objects.get(id=player_id)
                    else:
                        if not name:
                            raise ValueError("name is required if player_id not provided")
                        player, _ = Player.objects.get_or_create(
                            name=name,
                            defaults={"nickname": nickname or None},
                        )
                        if nickname and player.nickname != nickname:
                            player.nickname = nickname
                            player.save()

                    if GamePlayer.objects.filter(game=game, seat_number=seat).exists():
                        raise ValueError(f"Seat {seat} already taken in this game")

                    GamePlayer.objects.create(
                        game=game,
                        player=player,
                        role=role,
                        seat_number=seat,
                    )
        except Player.DoesNotExist:
            return Response({"error": "player_id not found"}, status=400)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        return Response({"ok": True}, status=201)

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
