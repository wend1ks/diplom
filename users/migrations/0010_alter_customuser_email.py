from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('users', '0009_passwordresetcode')]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='email',
            field=models.EmailField(max_length=254, unique=True, verbose_name='email address'),
        ),
    ]
