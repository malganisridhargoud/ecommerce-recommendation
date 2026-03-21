# Generated migration to add moderation fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('equipment', '0008_equipment_subscription'),
    ]

    operations = [
        migrations.AddField(
            model_name='equipment',
            name='moderation_status',
            field=models.CharField(
                choices=[('pending', 'Pending Approval'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                default='pending',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='equipment',
            name='moderation_notes',
            field=models.TextField(blank=True),
        ),
    ]
