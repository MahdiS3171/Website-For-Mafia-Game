from django.db import models
from games.models import Game, GamePlayer
from roles.models import Role
from django.utils import timezone

# class Log(models.Model):
#     game = models.ForeignKey(Game, on_delete=models.CASCADE)
#     game_player = models.ForeignKey(GamePlayer, on_delete=models.CASCADE)
#     phase = models.CharField(max_length=10, choices=[('day', 'Day'), ('night', 'Night')])
#     round_number = models.PositiveIntegerField()
#     action = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.phase.title()} {self.round_number} - {self.game_player.player.name}"
    
class Log(models.Model):
    """
    Generic log entry for any in-game action.
    Uses a through model (LogTarget) to support tagged targets (e.g., 'guard', 'save').
    """
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE)
    game_player = models.ForeignKey('games.GamePlayer', on_delete=models.CASCADE)
    action_type = models.ForeignKey('actions.ActionType', on_delete=models.CASCADE)

    targets = models.ManyToManyField(
        'games.GamePlayer',
        through='logs.LogTarget',          # string path avoids import-order issues
        related_name='logs_targeted'
    )

    PHASE_CHOICES = [
        ('day', 'Day'),
        ('night', 'Night'),
    ]
    phase = models.CharField(max_length=10, choices=PHASE_CHOICES)
    round_number = models.PositiveIntegerField()
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Optional link to a DayTurn when logging during a player's turn
    day_turn = models.ForeignKey('logs.DayTurn', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return (f"Log g{self.game_id} p{self.game_player_id} "
                f"a{self.action_type_id} r{self.round_number} {self.phase}")


class LogTarget(models.Model):
    """
    Target row with an optional tag to distinguish roles (e.g., 'target', 'guard', 'save').
    """
    log = models.ForeignKey('logs.Log', related_name='log_targets', on_delete=models.CASCADE)
    target = models.ForeignKey('games.GamePlayer', on_delete=models.CASCADE)
    tag = models.CharField(max_length=32, blank=True, null=True)

    class Meta:
        unique_together = ('log', 'target', 'tag')

    def __str__(self):
        return f"LogTarget {self.log_id} -> {self.target_id} [{self.tag}]"

class GamePhase(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    phase_type = models.CharField(choices=[("day", "Day"), ("night", "Night")], max_length=10)
    number = models.IntegerField()
    start_time = models.DateTimeField(auto_now_add=True)

class NightAction(models.Model):
    phase = models.ForeignKey(GamePhase, on_delete=models.CASCADE)
    actor = models.ForeignKey(GamePlayer, on_delete=models.CASCADE, related_name="night_actions")
    target = models.ForeignKey(GamePlayer, on_delete=models.SET_NULL, null=True, blank=True, related_name="night_targets")
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    action_type = models.CharField(max_length=30)
    result = models.TextField(blank=True, null=True)

class DaySpeech(models.Model):
    phase = models.ForeignKey(GamePhase, on_delete=models.CASCADE)
    speaker = models.ForeignKey(GamePlayer, on_delete=models.CASCADE)
    order = models.IntegerField()
    content = models.TextField()
    started_at = models.DateTimeField(auto_now_add=True)

class SpeechAction(models.Model):
    speech = models.ForeignKey(DaySpeech, on_delete=models.CASCADE)
    action_type = models.CharField(choices=[
        ("accuse", "Accuse"),
        ("defend", "Defend"),
        ("guess_mafia", "Guess Mafia")
    ], max_length=20)
    targets = models.ManyToManyField(GamePlayer, related_name="day_targets")
    guess_k = models.IntegerField(null=True, blank=True)

class Vote(models.Model):
    phase = models.ForeignKey(GamePhase, on_delete=models.CASCADE)
    voter = models.ForeignKey(GamePlayer, on_delete=models.CASCADE, related_name="votes_cast")
    target = models.ForeignKey(GamePlayer, on_delete=models.CASCADE, related_name="votes_received")
    vote_round = models.IntegerField(choices=[(1, "First Round"), (2, "Second Round")])

class Defense(models.Model):
    phase = models.ForeignKey(GamePhase, on_delete=models.CASCADE)
    defender = models.ForeignKey(GamePlayer, on_delete=models.CASCADE)
    content = models.TextField()

class Will(models.Model):
    phase = models.ForeignKey(GamePhase, on_delete=models.CASCADE)
    player = models.ForeignKey(GamePlayer, on_delete=models.CASCADE)
    content = models.TextField()

class Elimination(models.Model):
    phase = models.ForeignKey(GamePhase, on_delete=models.CASCADE)
    eliminated_player = models.ForeignKey(GamePlayer, on_delete=models.CASCADE)
    reason = models.CharField(max_length=30)
    time = models.DateTimeField(auto_now_add=True)
    
class DayPhaseManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(phase_type='day')

class NightPhaseManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(phase_type='night')


class DayPhase(GamePhase):
    objects = DayPhaseManager()

    class Meta:
        proxy = True
        verbose_name = 'Day Phase'
        verbose_name_plural = 'Day Phases'


class NightPhase(GamePhase):
    objects = NightPhaseManager()

    class Meta:
        proxy = True
        verbose_name = 'Night Phase'
        verbose_name_plural = 'Night Phases'
        
        
class DayTurn(models.Model):
    """
    Global turn index per day (round_number). Only one open turn per game at a time.
    Example: Day 3, Turn #16, actor = seat X.
    """
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField()          # the Day number
    index = models.PositiveIntegerField()                 # Turn number within that day (1..N)
    actor = models.ForeignKey('games.GamePlayer', on_delete=models.CASCADE)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = (('game', 'round_number', 'index'),)
        ordering = ['game_id', 'round_number', 'index']

    def close(self):
        if not self.closed_at:
            self.closed_at = timezone.now()
            self.save(update_fields=['closed_at'])

    def __str__(self):
        return f"Game {self.game_id} D{self.round_number} T#{self.index} (actor {self.actor_id})"

