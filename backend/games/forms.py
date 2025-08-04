from django import forms
from django.forms import modelformset_factory
from .models import Game, GamePlayer

class GameForm(forms.ModelForm):
    class Meta:
        model = Game
        fields = ['title', 'is_active']
        labels = {
            'title': 'عنوان بازی',
            'is_active': 'بازی فعال است؟',
        }
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


class GamePlayerForm(forms.ModelForm):
    class Meta:
        model = GamePlayer
        fields = ['player', 'role', 'seat_number']
        labels = {
            'player': 'بازیکن',
            'role': 'نقش',
            'seat_number': 'شماره صندلی',
        }
        widgets = {
            'player': forms.Select(attrs={'class': 'form-control'}),
            'role': forms.Select(attrs={'class': 'form-control'}),
            'seat_number': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
        }


GamePlayerFormSet = modelformset_factory(
    GamePlayer,
    form=GamePlayerForm,
    extra=1,  # or whatever number of players you want by default
    can_delete=True
)
