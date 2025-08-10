from django.db import migrations, connection

def drop_description(apps, schema_editor):
    # Try to drop 'description' if it exists.
    # SQLite 3.35+ supports DROP COLUMN; for older versions this no-ops.
    with connection.cursor() as cursor:
        # detect column
        cursor.execute("PRAGMA table_info(roles_role);")
        cols = [row[1] for row in cursor.fetchall()]
        if 'description' not in cols:
            return
        try:
            cursor.execute("ALTER TABLE roles_role DROP COLUMN description;")
        except Exception:
            # If DROP COLUMN isn't supported (very old SQLite), you can skip,
            # or rebuild the table (more involved). For dev, skipping is fine.
            pass

def restore_description(apps, schema_editor):
    # Reverse: add the column back with a default (best-effort; SQLite may not support ADD with NOT NULL without default)
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(roles_role);")
        cols = [row[1] for row in cursor.fetchall()]
        if 'description' in cols:
            return
        try:
            cursor.execute("ALTER TABLE roles_role ADD COLUMN description TEXT;")
        except Exception:
            pass

class Migration(migrations.Migration):
    dependencies = [
        ('roles', '0002_seed_roles'),
    ]
    operations = [
        migrations.RunPython(drop_description, reverse_code=restore_description),
    ]
