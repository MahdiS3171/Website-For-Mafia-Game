from django.db import models
from django.utils.text import slugify

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    is_mafia = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=99)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "role"
            candidate = base
            i = 2
            while Role.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base}-{i}"
                i += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
