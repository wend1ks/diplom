from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('users', '0007_alter_customuser_role')]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='github_id',
            field=models.BigIntegerField(blank=True, null=True, unique=True),
        ),
    ]
