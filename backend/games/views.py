from rest_framework import viewsets
from .models import Game, GamePlayer
from .serializers import GameSerializer, GamePlayerSerializer

from django.shortcuts import render, redirect, get_object_or_404
from .models import Game, GamePlayer
from .forms import GameForm, GamePlayerFormSet

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

class GamePlayerViewSet(viewsets.ModelViewSet):
    queryset = GamePlayer.objects.all()
    serializer_class = GamePlayerSerializer
    
def game_list(request):
    games = Game.objects.all()
    return render(request, 'games/game_list.html', {'games': games})

def game_detail(request, pk):
    game = get_object_or_404(Game, pk=pk)
    game_players = GamePlayer.objects.filter(game=game).order_by('seat_number')
    return render(request, 'games/game_detail.html', {'game': game, 'game_players': game_players})


def game_create(request):
    if request.method == 'POST':
        game_form = GameForm(request.POST)
        formset = GamePlayerFormSet(request.POST)
        if game_form.is_valid() and formset.is_valid():
            seat_numbers = []
            for form in formset:
                seat_number = form.cleaned_data.get('seat_number')
                if seat_number in seat_numbers:
                    form.add_error('seat_number', 'شماره صندلی تکراری است.')
                    break
                seat_numbers.append(seat_number)

            if all(form.is_valid() for form in formset):
                game = game_form.save()
                players = formset.save(commit=False)
                for player in players:
                    player.game = game
                    player.save()
                return redirect('games:detail', pk=game.pk)
    else:
        game_form = GameForm()
        formset = GamePlayerFormSet(queryset=GamePlayer.objects.none())
    return render(request, 'games/game_form.html', {'form': game_form, 'formset': formset})