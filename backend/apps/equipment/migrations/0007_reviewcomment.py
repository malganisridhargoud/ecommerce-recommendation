from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("equipment", "0006_review_vendor_reply_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReviewComment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_id", models.CharField(max_length=255)),
                ("comment", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="replies",
                        to="equipment.reviewcomment",
                    ),
                ),
                (
                    "review",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comments",
                        to="equipment.review",
                    ),
                ),
            ],
            options={
                "db_table": "review_comments",
                "ordering": ["created_at"],
            },
        ),
    ]
