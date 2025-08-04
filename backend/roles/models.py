from django.db import models

class Role(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_mafia = models.BooleanField(default=False)
    order = models.IntegerField(help_text="ترتیب بیدار شدن در شب")

    def __str__(self):
        return self.name