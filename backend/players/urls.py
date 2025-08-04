from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet

# router = DefaultRouter()
# router.register(r'', PlayerViewSet)

# urlpatterns = [
#     path('', include(router.urls)),
# ]

from django.urls import path
from . import views

app_name = 'players'

urlpatterns = [
    path('', views.player_list, name='list'),
    path('create/', views.player_create, name='create'),
]