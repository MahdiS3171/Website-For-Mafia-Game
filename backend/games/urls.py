from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GameViewSet, GamePlayerViewSet, GameRoleViewSet

router = DefaultRouter()
router.register(r'', GameViewSet, basename='game')
router.register(r'players', GamePlayerViewSet, basename='game-players')
router.register(r'roles', GameRoleViewSet, basename='game-roles')

app_name = 'games'

urlpatterns = [
    path('', include(router.urls)),
]
