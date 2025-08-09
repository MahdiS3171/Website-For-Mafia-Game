"""
URL configuration for mafia_log project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from games.views import GameViewSet, GamePlayerViewSet
from players.views import PlayerViewSet
from roles.views import RoleViewSet
from logs.views import LogViewSet
from actions.views import ActionViewSet, ActionTypeViewSet

# API Router
router = DefaultRouter()
router.register(r'api/games', GameViewSet)
router.register(r'api/game-players', GamePlayerViewSet)
router.register(r'api/players', PlayerViewSet)
router.register(r'api/roles', RoleViewSet)
router.register(r'api/logs', LogViewSet)
router.register(r'api/actions', ActionViewSet)
router.register(r'api/action-types', ActionTypeViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('players/', include('players.urls')),
    path('roles/', include('roles.urls')),
    path('games/', include('games.urls')),
    path('logs/', include('logs.urls')),
    path('actions/', include('actions.urls')),
    path('', include(router.urls)),
]

