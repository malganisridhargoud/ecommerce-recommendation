from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_userprofile_preferred_language_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="email",
            field=models.EmailField(blank=True, max_length=254),
        ),
    ]
