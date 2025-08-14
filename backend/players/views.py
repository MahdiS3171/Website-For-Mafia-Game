from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Player
from .serializers import PlayerSerializer, PlayerWithStatsSerializer
from rest_framework.filters import OrderingFilter
from django.db.models import Count, Sum, Case, When, IntegerField, Q, ExpressionWrapper, F, FloatField, Value

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all().order_by('name')
    permission_classes = [IsAuthenticated]
    
    # 🔎 enable ?search= to search by name/nickname
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'nickname']
    
    def get_serializer_class(self):
        if self.request and self.request.query_params.get("with_stats"):
            return PlayerWithStatsSerializer
        return PlayerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("with_stats"):
            completed = Q(gameplayer__game__ended_at__isnull=False)
            qs = qs.annotate(
                games_played=Count("gameplayer__game", distinct=True),
                wins=Sum(
                    Case(
                        # Mafia role and Mafia won
                        When(completed & Q(gameplayer__role__is_mafia=True)  & Q(gameplayer__game__winner__iexact="mafia"),   then=1),
                        # Citizen role and Citizens won
                        When(completed & Q(gameplayer__role__is_mafia=False) & Q(gameplayer__game__winner__iexact="citizen"), then=1),
                        default=0,
                        output_field=IntegerField(),
                    )
                ),
            )
            
            win_rate_expr = Case(
                When(games_played__gt=0,
                     then=ExpressionWrapper(100.0 * F("wins") / F("games_played"), output_field=FloatField())),
                default=Value(0.0),
                output_field=FloatField(),
            )
            qs = qs.annotate(win_rate=win_rate_expr)
            
            return qs            
            
        return qs
    