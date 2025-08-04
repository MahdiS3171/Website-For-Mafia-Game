from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GamePhaseViewSet, DaySpeechViewSet

from django.urls import path
from . import views

# router = DefaultRouter()
# router.register(r'phases', GamePhaseViewSet)
# router.register(r'speeches', DaySpeechViewSet)

# urlpatterns = [
#     path('', include(router.urls)),
# ]

# app_name = 'logs'

# urlpatterns = [
#     path('day/<int:pk>/', views.day_phase_log, name='day'),
#     path('night/<int:pk>/', views.night_phase_log, name='night'),
# ]

from django.urls import path
from . import views

app_name = 'logs'

urlpatterns = [
    path('create/<int:game_id>/', views.create_log, name='create'),
    # path('create/<int:game_id>/', views.log_create, name='create'),
    # path('<int:pk>/delete/', views.log_delete, name='delete'),
]