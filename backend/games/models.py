from django.db import models
from players.models import Player
from roles.models import Role

class Game(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    winner = models.CharField(max_length=50, blank=True, null=True)
    current_phase = models.CharField(
        max_length=10,
        choices=[('day', 'Day'), ('night', 'Night')],
        default='day'
    )
    round_number = models.PositiveIntegerField(default=1)
    ended_at   = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return self.title or f"Game #{self.pk}"


class GamePlayer(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    seat_number = models.IntegerField()
    is_alive = models.BooleanField(default=True)
    eliminated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["seat_number", "id"]

    def __str__(self) -> str:
        return f"Game {self.game_id} – Seat {self.seat_number} – {self.player}"

    @property
    def side(self) -> str | None:
        """Convenience label derived from role.is_mafia."""
        if self.role is None or self.role.is_mafia is None:
            return None
        return "mafia" if self.role.is_mafia else "citizen"

class GameRole(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    count = models.IntegerField()
