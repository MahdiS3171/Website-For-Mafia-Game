from django.db import models
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

    def __str__(self):
        return self.name

class Action(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    action_type = models.ForeignKey(ActionType, on_delete=models.CASCADE)
    performer = models.ForeignKey(GamePlayer, on_delete=models.CASCADE, related_name='performed_actions')
    day_number = models.PositiveIntegerField()
    targets = models.ManyToManyField(GamePlayer, related_name='targeted_by_actions')

    def __str__(self):
        return f"{self.action_type.name} توسط {self.performer} در روز {self.day_number}"
