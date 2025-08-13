from rest_framework import viewsets, permissions, mixins
from .models import Action, ActionType
from .serializers import ActionSerializer, ActionTypeSerializer

class ActionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ActionSerializer
    def get_queryset(self):
        qs = Action.objects.all()
        game_id = self.request.query_params.get("game")
        permission_classes = [permissions.AllowAny] 
        if game_id:
            qs = qs.filter(game_id=game_id)
        return qs

class ActionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActionType.objects.all().order_by("name")
    serializer_class = ActionTypeSerializer
