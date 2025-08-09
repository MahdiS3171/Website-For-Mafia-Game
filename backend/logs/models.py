from django.db import models
from games.models import Game, GamePlayer
from roles.models import Role

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
    """Generic log entry for any in-game action.

    The previous implementation only kept a list of target ``GamePlayer``
    instances which made it impossible to distinguish between actions that
    required multiple targets with different meanings (e.g. the *terror*
    action which has a ``target``, ``guard`` and ``save`` player).  To make the
    logging flexible enough for all of the actions described in the user
    requirements we introduce a small through model ``LogTarget`` which allows
    us to store an optional ``tag`` for every target.  In addition a ``details``
    JSON field is added so actions like "k of n" or "claim" can keep arbitrary
    extra information.
    """

    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    game_player = models.ForeignKey(GamePlayer, on_delete=models.CASCADE)
    action_type = models.ForeignKey('actions.ActionType', on_delete=models.CASCADE)
    targets = models.ManyToManyField(
        GamePlayer,
        through='LogTarget',
        related_name='logs_targeted'
    )
    phase = models.CharField(max_length=10, choices=[('day', 'روز'), ('night', 'شب')])
    round_number = models.PositiveIntegerField()
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class LogTarget(models.Model):
    """Through table storing the meaning/tag of each target in a log."""

    log = models.ForeignKey('Log', on_delete=models.CASCADE, related_name='log_targets')
    target = models.ForeignKey(GamePlayer, on_delete=models.CASCADE)
    tag = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        unique_together = ('log', 'target', 'tag')

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