from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0006_teacherrequest"),
    ]

    operations = [
        migrations.AlterField(
            model_name="customuser",
            name="role",
            field=models.CharField(
                choices=[
                    ("student", "Ученик"),
                    ("admin", "Админ"),
                    ("teacher", "Преподаватель"),
                ],
                default="student",
                max_length=20,
            ),
        ),
    ]
