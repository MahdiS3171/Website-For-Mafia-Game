from rest_framework import serializers
from .models import Action, ActionType

class ActionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionType
        fields = ['id','name','slug','phase','config']

class ActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Action
        fields = ['id', 'game', 'action_type', 'performer', 'day_number', 'targets']
