# Generated migration to add kyc_status field to Vendor

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('equipment', '0009_equipment_moderation'),
    ]

    operations = [
        migrations.AddField(
            model_name='vendor',
            name='kyc_status',
            field=models.CharField(
                choices=[('not_started', 'Not Started'), ('pending', 'Pending Verification'), ('verified', 'Verified'), ('rejected', 'Rejected')],
                default='not_started',
                max_length=20
            ),
        ),
    ]
