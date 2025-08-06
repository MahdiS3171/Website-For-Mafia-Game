from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoleViewSet

router = DefaultRouter()
router.register(r'', RoleViewSet, basename='role')

app_name = 'roles'

urlpatterns = [
    path('', include(router.urls)),
]
