# actions/urls.py

from django.urls import path
from . import views

app_name = 'actions'

urlpatterns = [
    path('add/<int:game_id>/', views.add_action, name='add'),
]
