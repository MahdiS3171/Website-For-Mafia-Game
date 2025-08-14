from rest_framework import viewsets, permissions, status
from .models import Log, GamePhase, DaySpeech
from .serializers import LogSerializer, GamePhaseSerializer, DaySpeechSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import DayTurn
from .serializers import DayTurnSerializer
from games.models import Game, GamePlayer
from rest_framework.permissions import IsAuthenticated

class DayTurnViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DayTurn.objects.all()
    serializer_class = DayTurnSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        game_id = self.request.query_params.get('game')
        open_only = self.request.query_params.get('open')
        if game_id:
            qs = qs.filter(game_id=game_id)
        if open_only:
            qs = qs.filter(closed_at__isnull=True)
        return qs

    @action(detail=False, methods=['post'])
    def start(self, request):
        game_id = request.data.get('game')
        actor_id = request.data.get('actor')
        if not game_id or not actor_id:
            return Response({"detail": "game and actor are required"}, status=400)

        try:
            game = Game.objects.get(pk=game_id)
        except Game.DoesNotExist:
            return Response({"detail": "Invalid game"}, status=400)

        if (game.current_phase or "").lower() != "day":
            return Response({"detail": "Turns can only be started during the Day phase"}, status=400)

        try:
            actor = GamePlayer.objects.get(pk=actor_id, game=game)
        except GamePlayer.DoesNotExist:
            return Response({"detail": "Invalid actor for this game"}, status=400)

        # only one open turn at a time per game
        if DayTurn.objects.filter(game=game, closed_at__isnull=True).exists():
            return Response({"detail": "There is already an open turn"}, status=409)

        round_number = game.round_number or 1
        next_index = DayTurn.objects.filter(game=game, round_number=round_number).count() + 1

        dt = DayTurn.objects.create(
            game=game,
            round_number=round_number,
            index=next_index,
            actor=actor,
        )
        return Response(DayTurnSerializer(dt).data, status=201)

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        try:
            dt = DayTurn.objects.get(pk=pk)
        except DayTurn.DoesNotExist:
            return Response({"detail": "Turn not found"}, status=404)
        if dt.closed_at:
            return Response(DayTurnSerializer(dt).data, status=200)
        dt.closed_at = timezone.now()
        dt.save(update_fields=['closed_at'])
        return Response(DayTurnSerializer(dt).data, status=200)

    @action(detail=False, methods=['get'])
    def current(self, request):
        game_id = request.query_params.get('game')
        if not game_id:
            return Response({"detail": "game query param is required"}, status=400)
        dt = DayTurn.objects.filter(game_id=game_id, closed_at__isnull=True).first()
        if not dt:
            return Response(status=204)
        return Response(DayTurnSerializer(dt).data)


class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Optionally filter by game ID (?game=1) or phase (?phase=day/night).
        """
        queryset = Log.objects.all().order_by('-created_at')
        game_id = self.request.query_params.get('game')
        phase = self.request.query_params.get('phase')

        if game_id:
            queryset = queryset.filter(game_id=game_id)
        if phase:
            queryset = queryset.filter(phase=phase)

        return queryset


class GamePhaseViewSet(viewsets.ModelViewSet):
    serializer_class = GamePhaseSerializer

    def get_queryset(self):
        """
        Optionally filter by game ID (?game=1) or phase_type (?phase_type=day/night).
        """
        queryset = GamePhase.objects.all()
        game_id = self.request.query_params.get('game')
        phase_type = self.request.query_params.get('phase_type')

        if game_id:
            queryset = queryset.filter(game_id=game_id)
        if phase_type:
            queryset = queryset.filter(phase_type=phase_type)

        return queryset


class DaySpeechViewSet(viewsets.ModelViewSet):
    serializer_class = DaySpeechSerializer

    def get_queryset(self):
        """
        Optionally filter by phase ID (?phase=3).
        """
        queryset = DaySpeech.objects.all()
        phase_id = self.request.query_params.get('phase')

        if phase_id:
            queryset = queryset.filter(phase_id=phase_id)

        return queryset
