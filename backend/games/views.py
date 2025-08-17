from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated , AllowAny
from .models import Game, GamePlayer, GameRole
from .serializers import GameSerializer, GamePlayerSerializer, GameRoleSerializer
from rest_framework import status, viewsets
from django.db import transaction
from players.models import Player
from roles.models import Role
from django.utils import timezone
from logs.models import DayTurn
from .services.results import build_game_results
from .serializers import GameResultsSerializer

# === Game ViewSet ===
class GameViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Game.objects.all().order_by('-created_at')
    serializer_class = GameSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a game as completed and set winner side."""
        game = self.get_object()
        winner = (request.data or {}).get('winner')

        if not winner:
            return Response({"error": "Winner field is required."}, status=400)

        game.is_active = False
        game.winner = winner  # Make sure `winner` field exists in Game model
        game.ended_at = timezone.now()
        game.save(update_fields=["ended_at", "is_active", "winner"])

        return Response(self.get_serializer(game).data)


    @action(detail=True, methods=['post'])
    def terminate_players(self, request, pk=None):
        game = self.get_object()

        data = request.data
        if not isinstance(data, list):
            return Response({"error": "Expected a JSON array"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ids = [int(str(x).strip()) for x in data if str(x).strip()]
        except (TypeError, ValueError):
            return Response({"error": "IDs must be integers"}, status=status.HTTP_400_BAD_REQUEST)

        if not ids:
            return Response({"error": "Provide a non-empty array"}, status=status.HTTP_400_BAD_REQUEST)

        qs = game.gameplayer_set.filter(id__in=ids)
        if not qs.exists():
            return Response({"error": "No matching seats for provided IDs"}, status=status.HTTP_400_BAD_REQUEST)

        updated = 0
        for gp in qs:
            changed = False
            # Support any schema variant you might have:
            if hasattr(gp, 'isterminated'):
                if not gp.isterminated:
                    gp.isterminated = True
                    changed = True
            if hasattr(gp, 'is_alive'):
                if gp.is_alive:
                    gp.is_alive = False
                    changed = True
            if hasattr(gp, 'eliminated_at'):
                if getattr(gp, 'eliminated_at') is None:
                    gp.eliminated_at = timezone.now()
                    changed = True
            if changed:
                gp.save()
                updated += 1

        return Response({"ok": True, "updated": updated}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def advance_phase(self, request, pk=None):
        game = self.get_object()
        current = (game.current_phase or "day").lower()
        DayTurn.objects.filter(game=game, closed_at__isnull=True).update(closed_at=timezone.now())
        if current == "day":
            game.current_phase = "night"
        else:
            game.current_phase = "day"
            game.round_number = (game.round_number or 0) + 1
        game.save(update_fields=["current_phase", "round_number"])
        return Response({"current_phase": game.current_phase, "round_number": game.round_number})
    
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
    
    @action(detail=True, methods=['get'], url_path='results')
    def results(self, request, pk=None):
        game = self.get_object()

        # Optional: only allow results for completed games
        if getattr(game, "is_active", False):
            return Response(
                {"detail": "Game is not completed yet."},
                status=status.HTTP_400_BAD_REQUEST
            )

        summary = build_game_results(game.id)
        data = GameResultsSerializer(summary).data
        return Response(data, status=status.HTTP_200_OK)



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
