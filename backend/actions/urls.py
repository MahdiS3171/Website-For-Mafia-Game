from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActionViewSet, ActionTypeViewSet

router = DefaultRouter()
router.register(r'', ActionViewSet, basename='action')
router.register(r'types', ActionTypeViewSet, basename='action-type')

app_name = 'actions'

urlpatterns = [
    path('', include(router.urls)),
]
