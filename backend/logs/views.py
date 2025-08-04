from rest_framework import viewsets
from .models import GamePhase, DaySpeech
from .serializers import GamePhaseSerializer, DaySpeechSerializer

from django.shortcuts import render, redirect, get_object_or_404
from .models import DayPhase, NightPhase
from .forms import DayPhaseForm, NightPhaseForm
from django.http import Http404

from django.shortcuts import render, get_object_or_404, redirect
from .models import Log
from .forms import LogForm
from games.models import Game, GamePlayer

from actions.models import ActionType
from django.contrib import messages

def create_log(request, game_id):
    game = get_object_or_404(Game, pk=game_id)
    game_players = GamePlayer.objects.filter(game=game).select_related('player')
    action_types = ActionType.objects.all()

    if request.method == 'POST':
        phase = request.POST.get('phase')
        round_number = int(request.POST.get('round_number'))

        for gp in game_players:
            for at in action_types:
                checkbox_name = f'action_{gp.pk}_{at.pk}'
                if checkbox_name in request.POST:
                    log = Log.objects.create(
                        game=game,
                        game_player=gp,
                        action_type=at,
                        phase=phase,
                        round_number=round_number
                    )
                    targets_field = f'targets_{gp.pk}_{at.pk}[]'
                    target_ids = request.POST.getlist(targets_field)
                    if target_ids:
                        log.targets.set(GamePlayer.objects.filter(pk__in=target_ids))
        messages.success(request, "لاگ‌ها با موفقیت ثبت شدند.")
        return redirect('games:detail', game.id)

    return render(request, 'logs/log_form.html', {
        'game': game,
        'game_players': game_players,
        'action_types': action_types,
    })

def log_create(request, game_id):
    game = get_object_or_404(Game, pk=game_id)
    game_players = GamePlayer.objects.filter(game=game).order_by('seat_number')
    if request.method == 'POST':
        formset_data = []
        for player in game_players:
            action = request.POST.get(f'action_{player.pk}', '')
            phase = request.POST.get('phase', 'day')
            round_number = request.POST.get('round_number', 1)
            if action:
                log = Log(game=game, game_player=player, phase=phase, round_number=round_number, action=action)
                log.save()
        return redirect('games:game_detail', pk=game.pk)
    return render(request, 'logs/log_form.html', {'game': game, 'game_players': game_players})


def log_delete(request, pk):
    log = get_object_or_404(Log, pk=pk)
    game_id = log.game.id
    if request.method == 'POST':
        log.delete()
        return redirect('games:game_detail', pk=game_id)
    return render(request, 'logs/log_confirm_delete.html', {'log': log})

class GamePhaseViewSet(viewsets.ModelViewSet):
    queryset = GamePhase.objects.all()
    serializer_class = GamePhaseSerializer

class DaySpeechViewSet(viewsets.ModelViewSet):
    queryset = DaySpeech.objects.all()
    serializer_class = DaySpeechSerializer
    
def day_phase_log(request, pk):
    phase = get_object_or_404(DayPhase, pk=pk)
    if phase.phase_type != "day":
        raise Http404("This is not a day phase.")
    if request.method == 'POST':
        form = DayPhaseForm(request.POST, instance=phase)
        if form.is_valid():
            form.save()
            return redirect('logs:day', pk=pk)
    else:
        form = DayPhaseForm(instance=phase)
    return render(request, 'logs/day_phase_form.html', {'form': form, 'phase': phase})

def night_phase_log(request, pk):
    phase = get_object_or_404(NightPhase, pk=pk)
    if phase.phase_type != "night":
        raise Http404("This is not a night phase.")
    if request.method == 'POST':
        form = NightPhaseForm(request.POST, instance=phase)
        if form.is_valid():
            form.save()
            return redirect('logs:night', pk=pk)
    else:
        form = NightPhaseForm(instance=phase)
    return render(request, 'logs/night_phase_form.html', {'form': form, 'phase': phase})
