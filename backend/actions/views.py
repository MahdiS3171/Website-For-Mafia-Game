from django.shortcuts import render, redirect, get_object_or_404
from .models import Action
from .forms import ActionForm
from games.models import Game

def add_action(request, game_id):
    game = get_object_or_404(Game, pk=game_id)
    if request.method == 'POST':
        form = ActionForm(request.POST, game=game)
        if form.is_valid():
            action = form.save(commit=False)
            action.game = game
            action.save()
            form.save_m2m()
            return redirect('games:detail', game_id=game.id)
    else:
        form = ActionForm(game=game)
    return render(request, 'actions/add_action.html', {'form': form, 'game': game})
