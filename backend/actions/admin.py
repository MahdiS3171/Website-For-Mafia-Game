from django.contrib import admin
from .models import ActionType, Action

@admin.register(ActionType)
class ActionTypeAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ['action_type', 'game', 'performer', 'day_number']
    list_filter = ['game', 'day_number', 'action_type']
    search_fields = ['performer__player__name']
    filter_horizontal = ['targets']
