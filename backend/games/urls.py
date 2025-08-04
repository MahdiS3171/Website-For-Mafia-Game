from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GameViewSet, GamePlayerViewSet
from django.urls import path
from . import views


# router = DefaultRouter()
# router.register(r'', GameViewSet)
# router.register(r'players', GamePlayerViewSet)

# urlpatterns = [
#     path('', include(router.urls)),
# ]

app_name = 'games'

urlpatterns = [
    path('', views.game_list, name='list'),
    path('create/', views.game_create, name='create'),
    path('<int:pk>/', views.game_detail, name='detail'),
]