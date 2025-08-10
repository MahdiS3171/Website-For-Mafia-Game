from rest_framework.viewsets import ReadOnlyModelViewSet
from .models import Role
from .serializers import RoleSerializer
from rest_framework.permissions import IsAuthenticated
# from rest_framework.pagination import NonePaginator

class RoleViewSet(ReadOnlyModelViewSet):
    queryset = Role.objects.all().order_by('order', 'name')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None