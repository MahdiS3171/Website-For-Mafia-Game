from django.db import migrations

def seed_action_types(apps, schema_editor):
    ActionType = apps.get_model('actions', 'ActionType')
    data = [
        {'name':'fling target','slug':'fling_target','phase':'day','config':{'tags':['target'],'separatePerTarget':True}},
        {'name':'target','slug':'target','phase':'day','config':{'tags':['target'],'separatePerTarget':True}},
        {'name':'siding','slug':'siding','phase':'day','config':{'tags':['side'],'multi':True}},
        {'name':'k of n target','slug':'k_of_n_target','phase':'day','config':{'params':['k','n'],'tags':[]}},
        {'name':'cover','slug':'cover','phase':'day','config':{'tags':['target'],'separatePerTarget':True}},
        {'name':'k of n cover','slug':'k_of_n_cover','phase':'day','config':{'params':['k','n'],'tags':[]}},
        {'name':'dialogue','slug':'dialogue','phase':'day','config':{'tags':['target']}},
        {'name':'first vote','slug':'first_vote','phase':'day','config':{'tags':['voter'],'multi':True}},
        {'name':'second vote','slug':'second_vote','phase':'day','config':{'tags':['voter'],'multi':True}},
        {'name':'defense','slug':'defense','phase':'day','config':{'tags':['defender']}},
        {'name':'claim','slug':'claim','phase':'day','config':{'choose_role':True}},
        {'name':'will','slug':'will','phase':'day','config':{'composite':['target','cover','claim']}},
        {'name':'no faces choice','slug':'no_faces_choice','phase':'night','config':{'tags':['choice']}},
        {'name':'boozer\'s shot','slug':'boozers_shot','phase':'night','config':{'tags':['target']}},
        {'name':'mafia kill','slug':'mafia_kill','phase':'night','config':{'tags':['target']}},
        {'name':'punished','slug':'punished','phase':'night','config':{'tags':['target']}},
        {'name':'secured','slug':'secured','phase':'night','config':{'tags':['target']}},
        {'name':'killer target','slug':'killer_target','phase':'night','config':{'tags':['mafia_suggest','city_saviour','city_suggest','killer_kill']}},
        {'name':'sniper\'s shot','slug':'snipers_shot','phase':'night','config':{'tags':['target']}},
        {'name':'doctor\'s save','slug':'doctors_save','phase':'night','config':{'tags':['save1','save2']}},
    ]
    for d in data:
        ActionType.objects.update_or_create(slug=d['slug'], defaults=d)

def unseed_action_types(apps, schema_editor):
    ActionType = apps.get_model('actions', 'ActionType')
    ActionType.objects.filter(slug__in=[
        'fling_target','target','siding','k_of_n_target','cover','k_of_n_cover','dialogue','first_vote','second_vote','defense','claim','will',
        'no_faces_choice','boozers_shot','mafia_kill','punished','secured','killer_target','snipers_shot','doctors_save'
    ]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('actions', '0002_actiontype_phase_actiontype_slug'),
    ]

    operations = [
        migrations.RunPython(seed_action_types, reverse_code=unseed_action_types)
    ]
