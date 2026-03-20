from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="preferred_language",
            field=models.CharField(default="en", max_length=20),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="preferred_location",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.CreateModel(
            name="BuyerAddress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_id", models.CharField(max_length=255)),
                ("label", models.CharField(default="Home", max_length=60)),
                ("full_name", models.CharField(max_length=255)),
                ("phone", models.CharField(max_length=30)),
                ("line1", models.CharField(max_length=255)),
                ("line2", models.CharField(blank=True, max_length=255)),
                ("city", models.CharField(max_length=80)),
                ("state", models.CharField(max_length=80)),
                ("postal_code", models.CharField(max_length=20)),
                ("country", models.CharField(default="India", max_length=80)),
                ("is_default", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "buyer_addresses",
                "ordering": ["-is_default", "-updated_at"],
            },
        ),
    ]
