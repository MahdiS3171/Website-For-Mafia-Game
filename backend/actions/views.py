from rest_framework import viewsets
from .models import Action
from .serializers import ActionSerializer

class ActionViewSet(viewsets.ModelViewSet):
    serializer_class = ActionSerializer

    def get_queryset(self):
        """
        Allow filtering actions by game ID via ?game=<id>
        """
        queryset = Action.objects.all()
        game_id = self.request.query_params.get('game')
        if game_id:
            queryset = queryset.filter(game_id=game_id)
        return queryset
