from rest_framework import viewsets
from .models import Action, ActionType
from .serializers import ActionSerializer, ActionTypeSerializer

class ActionViewSet(viewsets.ModelViewSet):
    serializer_class = ActionSerializer

    def get_queryset(self):
        queryset = Action.objects.all()
        game_id = self.request.query_params.get('game')
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        return queryset

class ActionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActionType.objects.all().order_by('name')
    serializer_class = ActionTypeSerializer
