from rest_framework import viewsets
from .models import Log, GamePhase, DaySpeech
from .serializers import LogSerializer, GamePhaseSerializer, DaySpeechSerializer

class LogViewSet(viewsets.ModelViewSet):
    serializer_class = LogSerializer

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
