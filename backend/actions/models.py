from django.db import models
from games.models import Game, GamePlayer

class ActionType(models.Model):
    name = models.CharField(max_length=100)

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
