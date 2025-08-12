from django.db import migrations

def up(apps, schema_editor):
    ActionType = apps.get_model('actions', 'ActionType')
    payload = [
        # ---- Day ----
        ("Fling Target",  "fling_target",  "day",  {"tags":["target"], "separate_per_target":True,  "allow_self":False}),
        ("Target",        "target",        "day",  {"tags":["target"], "separate_per_target":True,  "allow_self":False}),
        ("Siding",        "siding",        "day",  {"tags":["side"],   "separate_per_target":False, "allow_self":False}),
        ("K of N Target", "k_of_n_target", "day",  {"tags":[], "params":["k","n"], "separate_per_target":False, "allow_self":False}),
        ("Cover",         "cover",         "day",  {"tags":["target"], "separate_per_target":True,  "allow_self":False}),
        ("K of N Cover",  "k_of_n_cover",  "day",  {"tags":[], "params":["k","n"], "separate_per_target":False, "allow_self":False}),
        ("Dialogue",      "dialogue",      "day",  {"tags":["target"], "separate_per_target":False, "allow_self":False}),
        ("First Vote",    "first_vote",    "day",  {"tags":[], "params":["n"], "separate_per_target":False, "allow_self":False}),
        ("Second Vote",   "second_vote",   "day",  {"tags":[], "params":["n"], "separate_per_target":False, "allow_self":False}),
        ("Defense",       "defense",       "day",  {"tags":["defense"],"separate_per_target":False, "allow_self":False}),
        ("Claim",         "claim",         "day",  {"tags":[], "separate_per_target":False, "allow_self":True, "choose_role":True}),
        ("Will",          "will",          "day",  {"tags":[], "separate_per_target":False, "allow_self":True}),

        # ---- Night ----
        ("No Faces Choice","no_faces_choice","night",{"tags":["target"],"separate_per_target":False,"allow_self":False}),
        ("Boozer's Shot",  "boozers_shot",  "night",{"tags":["target"],"separate_per_target":False,"allow_self":False}),
        ("Mafia Kill",     "mafia_kill",    "night",{"tags":["target"],"separate_per_target":False,"allow_self":False}),
        ("Punished",       "punished",      "night",{"tags":["target"],"separate_per_target":False,"allow_self":False}),
        ("Secured",        "secured",       "night",{"tags":["target"],"separate_per_target":False,"allow_self":False}),
        ("Killer Target",  "killer_target", "night",{"tags":["mafia_suggest","city_saviour","city_suggest","killer_kill"],"separate_per_target":False,"allow_self":False}),
        ("Sniper's Shot",  "snipers_shot",  "night",{"tags":["target"],"separate_per_target":False,"allow_self":False}),
        ("Doctor's Save",  "doctors_save",  "night",{"tags":["save1","save2"],"separate_per_target":False,"allow_self":True}),
        ("Terror",         "terror",        "night",{"tags":["target","guard","save"],"separate_per_target":False,"allow_self":False}),
    ]
    for name, slug, phase, config in payload:
        ActionType.objects.update_or_create(
            slug=slug,
            defaults={"name": name, "phase": phase, "config": config},
        )

def down(apps, schema_editor):
    # No-op or selectively revert configs if you want
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('actions', '0006_action_created_at_action_details_action_phase_and_more'),
    ]

    operations = [
        migrations.RunPython(up, reverse_code=down),
    ]
