from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("equipment", "0004_wishlistitem"),
    ]

    operations = [
        migrations.CreateModel(
            name="CartItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_id", models.CharField(max_length=255)),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "equipment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="cart_items",
                        to="equipment.equipment",
                    ),
                ),
            ],
            options={
                "db_table": "cart_items",
                "ordering": ["-updated_at"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("user_id", "equipment", "start_date", "end_date"),
                        name="unique_cart_line_per_date_window",
                    )
                ],
            },
        ),
    ]
