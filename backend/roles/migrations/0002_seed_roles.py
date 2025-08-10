from django.db import migrations, connection
from django.utils.text import slugify

DATA = [
    # citizens
    ('no face', False, 3),
    ('boozer', False, 4),
    ('sniper', False, 5),
    ('doctor', False, 2),
    ('normal citizen', False, 99),
    # mafia
    ('godfather', True, 1),
    ('punisher', True, 1),
    ('killer', True, 1),
    ('attorney', True, 1),
    ('terrorist', True, 1),
    ('normal mafia', True, 99),
]

def seed_roles(apps, schema_editor):
    # detect if legacy 'description' column still exists on roles_role
    with connection.cursor() as cursor:
        has_desc = False
        table = 'roles_role'
        # SQLite: PRAGMA; Postgres: information_schema works too, but PRAGMA is fine in SQLite dev
        try:
            cursor.execute("PRAGMA table_info(roles_role);")
            cols = [row[1] for row in cursor.fetchall()]
            has_desc = 'description' in cols
        except Exception:
            # fallback: assume no description
            has_desc = False

        # wipe existing rows
        cursor.execute("DELETE FROM roles_role;")

        # insert rows; include description='' if the column exists
        for name, is_mafia, order in DATA:
            slug = slugify(name)
            if has_desc:
                cursor.execute(
                    "INSERT INTO roles_role (name, slug, is_mafia, [order], description) VALUES (%s, %s, %s, %s, %s)",
                    [name, slug, int(is_mafia), order, ""],
                )
            else:
                cursor.execute(
                    "INSERT INTO roles_role (name, slug, is_mafia, [order]) VALUES (%s, %s, %s, %s)",
                    [name, slug, int(is_mafia), order],
                )

def unseed_roles(apps, schema_editor):
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM roles_role;")

class Migration(migrations.Migration):
    dependencies = [
        ('roles', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(seed_roles, reverse_code=unseed_roles),
    ]
