from django.db import migrations

def create_action_types(apps, schema_editor):
    ActionType = apps.get_model('actions', 'ActionType')
    # Remove any legacy records created before slugs were introduced
    ActionType.objects.filter(slug__isnull=True).delete()
    actions = [
        ("Fling Target", "fling_target", "day"),
        ("Target", "target", "day"),
        ("Siding", "siding", "day"),
        ("K of N Target", "k_of_n_target", "day"),
        ("Cover", "cover", "day"),
        ("K of N Cover", "k_of_n_cover", "day"),
        ("Dialogue", "dialogue", "day"),
        ("First Vote", "first_vote", "day"),
        ("Second Vote", "second_vote", "day"),
        ("Defense", "defense", "day"),
        ("Claim", "claim", "day"),
        ("Will", "will", "day"),
        ("Terror", "terror", "night"),
        ("No Faces Choice", "no_faces_choice", "night"),
        ("Boozer's Shot", "boozers_shot", "night"),
        ("Mafia Kill", "mafia_kill", "night"),
        ("Punished", "punished", "night"),
        ("Secured", "secured", "night"),
        ("Killer Target", "killer_target", "night"),
        ("Sniper's Shot", "snipers_shot", "night"),
        ("Doctor's Save", "doctors_save", "night"),
    ]
    for name, slug, phase in actions:
        ActionType.objects.update_or_create(slug=slug, defaults={"name": name, "phase": phase})

class Migration(migrations.Migration):
    dependencies = [
        ("actions", "0002_actiontype_phase_actiontype_slug"),
    ]
    operations = [
        migrations.RunPython(create_action_types),
    ]
