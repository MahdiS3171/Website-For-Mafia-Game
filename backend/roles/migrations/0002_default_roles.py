from django.db import migrations

def create_roles(apps, schema_editor):
    Role = apps.get_model('roles', 'Role')
    roles = [
        ("No Face", False, 1),
        ("Boozer", False, 2),
        ("Sniper", False, 3),
        ("Doctor", False, 4),
        ("Normal Citizen", False, 5),
        ("Godfather", True, 1),
        ("Punisher", True, 2),
        ("Killer", True, 3),
        ("Attorney", True, 4),
        ("Terrorist", True, 5),
        ("Normal Mafia", True, 6),
    ]
    for name, is_mafia, order in roles:
        Role.objects.update_or_create(name=name, defaults={"is_mafia": is_mafia, "order": order})

class Migration(migrations.Migration):
    dependencies = [
        ("roles", "0001_initial"),
    ]
    operations = [
        migrations.RunPython(create_roles),
    ]
