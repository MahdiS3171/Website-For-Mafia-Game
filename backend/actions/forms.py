from django import forms
from .models import Action
from games.models import GamePlayer

class ActionForm(forms.ModelForm):
    class Meta:
        model = Action
        fields = ['action_type', 'performer', 'day_number', 'targets']

    def __init__(self, *args, **kwargs):
        game = kwargs.pop('game', None)
        super().__init__(*args, **kwargs)
        if game:
            qs = GamePlayer.objects.filter(game=game)
            self.fields['performer'].queryset = qs
            self.fields['targets'].queryset = qs
        self.fields['targets'].widget = forms.CheckboxSelectMultiple()
