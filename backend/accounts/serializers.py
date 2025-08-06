from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    isAdmin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['username', 'isAdmin']

    def get_isAdmin(self, obj):
        return obj.is_staff or obj.is_superuser
