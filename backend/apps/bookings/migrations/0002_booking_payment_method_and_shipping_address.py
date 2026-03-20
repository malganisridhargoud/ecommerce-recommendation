from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="payment_method",
            field=models.CharField(
                choices=[("stripe", "Stripe"), ("cod", "Cash on Delivery")],
                default="stripe",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="booking",
            name="shipping_address",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
