from django.urls import path
from . import views

app_name = 'roles'

urlpatterns = [
    path('', views.role_list, name='list'),
    path('create/', views.role_create, name='create'),
    path('<int:pk>/edit/', views.role_edit, name='edit'),
    path('<int:pk>/delete/', views.role_delete, name='delete'),
]