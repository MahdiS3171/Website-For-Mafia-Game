from django.db import models
from players.models import Player
from roles.models import Role

class Game(models.Model):
    title = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    winner = models.CharField(max_length=50, blank=True, null=True)
    current_phase = models.CharField(max_length=10, choices=[('day','Day'),('night','Night')], default='day')
    round_number = models.PositiveIntegerField(default=1)

class GamePlayer(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    seat_number = models.IntegerField()
    is_alive = models.BooleanField(default=True)
    eliminated_at = models.DateTimeField(blank=True, null=True)

class GameRole(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    count = models.IntegerField()
