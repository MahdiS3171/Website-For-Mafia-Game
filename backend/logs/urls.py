from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogViewSet, GamePhaseViewSet, DaySpeechViewSet, DayTurnViewSet

# DRF Router for automatic CRUD endpoints
router = DefaultRouter()
router.register(r'', LogViewSet, basename='log')                 # /api/logs/
router.register(r'phases', GamePhaseViewSet, basename='gamephase')  # /api/logs/phases/
router.register(r'day-speeches', DaySpeechViewSet, basename='dayspeech')  # /api/logs/day-speeches/
router.register(r'turns', DayTurnViewSet, basename='day-turn')

app_name = 'logs'

urlpatterns = [
    path('', include(router.urls)),
]
