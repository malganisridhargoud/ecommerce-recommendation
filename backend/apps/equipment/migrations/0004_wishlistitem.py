from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("equipment", "0003_equipment_booking_count_equipment_deposit_amount_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="WishlistItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_id", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "equipment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="wishlisted_by",
                        to="equipment.equipment",
                    ),
                ),
            ],
            options={
                "db_table": "wishlist_items",
                "ordering": ["-created_at"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("user_id", "equipment"),
                        name="unique_user_equipment_wishlist",
                    )
                ],
            },
        ),
    ]
