# # accounts/urls.py
# from django.urls import path
# from rest_framework.authtoken.views import obtain_auth_token
# from .views import user_profile

# urlpatterns = [
#     path('token/', obtain_auth_token, name='api_token_auth'),  # POST username + password → token
#     path('profile/', user_profile, name='api_profile'),        # GET → user profile
# ]

from django.urls import path
from .views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

app_name = "accounts"

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]

