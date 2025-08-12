from django.db import models
from django.contrib.postgres.fields import ArrayField
from games.models import Game, GamePlayer

class ActionType(models.Model):
    """Type of an action that can be performed in the game.

    A ``slug`` field is added so the frontend can reference action types
    without relying on database generated IDs.  ``phase`` indicates whether
    the action belongs to the day or night phase which is useful when
    presenting available actions to the user.
    """

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    phase = models.CharField(max_length=10, choices=[('day', 'Day'), ('night', 'Night')])
    config = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name

class Action(models.Model):
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='actions')
    action_type = models.CharField(max_length=64)  # slug
    performer = models.ForeignKey('games.GamePlayer', on_delete=models.CASCADE, related_name='performed_actions')

    # RENAME or ADD: keep existing day_number for backward-compat, but add round_number
    day_number = models.IntegerField(null=True, blank=True)   # legacy
    round_number = models.IntegerField(null=True, blank=True) # new

    # NEW:
    phase = models.CharField(max_length=5, choices=(('day','day'), ('night','night')), null=True, blank=True)
    details = models.JSONField(null=True, blank=True)

    # you already have this:
    targets = models.ManyToManyField(GamePlayer, related_name='targeted_actions', blank=True)  # e.g. [{ "target": <gp_id>, "tag": "target" }]

    created_at = models.DateTimeField(auto_now_add=True)
