import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.management import call_command

with open("courses.json", "w", encoding="utf-8") as f:
    call_command(
        "dumpdata",
        "courses",
        indent=2,
        stdout=f,
    )

print("Курсы успешно экспортированы в courses.json")