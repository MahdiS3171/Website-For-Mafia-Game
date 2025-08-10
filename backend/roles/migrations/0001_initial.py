# Generated manually to restore the roles initial migration

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(max_length=120, unique=True, blank=True)),
                ('is_mafia', models.BooleanField(default=False)),
                ('order', models.PositiveIntegerField(default=99)),
            ],
        ),
    ]
