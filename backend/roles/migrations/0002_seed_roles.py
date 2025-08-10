from django.db import migrations

def seed_roles(apps, schema_editor):
    Role = apps.get_model('roles', 'Role')
    data = [
        {'name':'no face','description':'Citizen role with no face choice','is_mafia':False,'order':3},
        {'name':'boozer','description':'Boozer shoots at night','is_mafia':False,'order':4},
        {'name':'sniper','description':'Sniper can shoot at night','is_mafia':False,'order':5},
        {'name':'doctor','description':'Doctor can save two','is_mafia':False,'order':2},
        {'name':'normal citizen','description':'Vanilla town','is_mafia':False,'order':99},
        {'name':'godfather','description':'Leads mafia','is_mafia':True,'order':1},
        {'name':'punisher','description':'Punishes','is_mafia':True,'order':1},
        {'name':'killer','description':'Killer special','is_mafia':True,'order':1},
        {'name':'attorney','description':'Attorney','is_mafia':True,'order':1},
        {'name':'terrorist','description':'Terrorist','is_mafia':True,'order':1},
        {'name':'normal mafia','description':'Vanilla mafia','is_mafia':True,'order':99},
    ]
    for d in data:
        Role.objects.get_or_create(name=d['name'], defaults=d)

def unseed_roles(apps, schema_editor):
    Role = apps.get_model('roles', 'Role')
    Role.objects.filter(name__in=[
        'no face','boozer','sniper','doctor','normal citizen',
        'godfather','punisher','killer','attorney','terrorist','normal mafia'
    ]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_roles, reverse_code=unseed_roles)
    ]
