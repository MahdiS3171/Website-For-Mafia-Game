from rest_framework import viewsets
from .models import Player
from .serializers import PlayerSerializer
from django.shortcuts import render, redirect
from .forms import PlayerForm

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer


def player_list(request):
    players = Player.objects.all()
    return render(request, 'players/player_list.html', {'players': players})

def player_create(request):
    if request.method == 'POST':
        form = PlayerForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('players:list')  # redirect to player list view
    else:
        form = PlayerForm()
    return render(request, 'players/player_form.html', {'form': form})