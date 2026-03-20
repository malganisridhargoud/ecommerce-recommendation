from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("equipment", "0003_equipment_booking_count_equipment_deposit_amount_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ChatThread",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("buyer_id", models.CharField(max_length=255)),
                ("vendor_id", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "equipment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chat_threads",
                        to="equipment.equipment",
                    ),
                ),
            ],
            options={
                "db_table": "chat_threads",
                "ordering": ["-updated_at"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("equipment", "buyer_id", "vendor_id"),
                        name="unique_thread_per_parties",
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="ChatMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sender_id", models.CharField(max_length=255)),
                ("message", models.TextField(blank=True)),
                ("attachment_url", models.URLField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "thread",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="communications.chatthread",
                    ),
                ),
            ],
            options={
                "db_table": "chat_messages",
                "ordering": ["created_at"],
            },
        ),
    ]
