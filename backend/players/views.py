from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Player
from .serializers import PlayerSerializer

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all().order_by('name')
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated]
    
    # 🔎 enable ?search= to search by name/nickname
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'nickname']
    