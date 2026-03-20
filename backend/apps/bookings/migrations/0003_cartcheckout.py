from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0002_booking_payment_method_and_shipping_address"),
    ]

    operations = [
        migrations.CreateModel(
            name="CartCheckout",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_id", models.CharField(max_length=255)),
                ("booking_ids", models.JSONField(blank=True, default=list)),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("payment_method", models.CharField(choices=[("stripe", "Stripe"), ("cod", "Cash on Delivery")], default="stripe", max_length=20)),
                ("stripe_payment_intent_id", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed")], default="pending", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "cart_checkouts",
                "ordering": ["-created_at"],
            },
        ),
    ]
