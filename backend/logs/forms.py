# logs/forms.py
from django import forms
from .models import GamePhase, Log

class LogForm(forms.ModelForm):
    class Meta:
        model = Log
        # fields = ['game_player', 'phase', 'round_number', 'action']
        fields = ['game_player', 'phase', 'round_number', 'action_type']

class DayPhaseForm(forms.ModelForm):
    class Meta:
        model = GamePhase
        fields = ['number']  # You can add more if you want to edit them
        labels = {
            'number': 'شماره فاز روز',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['number'].widget.attrs.update({'class': 'form-control'})

class NightPhaseForm(forms.ModelForm):
    class Meta:
        model = GamePhase
        fields = ['number']
        labels = {
            'number': 'شماره فاز شب',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['number'].widget.attrs.update({'class': 'form-control'})
