from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("actions", "0003_default_actiontypes"),
    ]
    operations = [
        migrations.AlterField(
            model_name="actiontype",
            name="slug",
            field=models.SlugField(max_length=100, unique=True),
        ),
    ]
