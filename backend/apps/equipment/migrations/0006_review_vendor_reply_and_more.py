from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("equipment", "0005_cartitem"),
    ]

    operations = [
        migrations.AddField(
            model_name="review",
            name="vendor_reply",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="review",
            name="vendor_reply_updated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
