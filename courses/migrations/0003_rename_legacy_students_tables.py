from django.db import migrations


def rename_legacy_tables(apps, schema_editor):
    tables = set(schema_editor.connection.introspection.table_names())
    renames = (
        ('students_assignment', 'courses_assignment'),
        ('students_assignmentsubmission', 'courses_assignmentsubmission'),
        ('students_lessonprogress', 'courses_lessonprogress'),
    )
    for old_name, new_name in renames:
        # Existing installations used the former "students" app label.  A
        # table rename preserves submitted work and progress; fresh databases
        # already receive the correct names from 0001_initial.
        if old_name in tables and new_name not in tables:
            schema_editor.execute(
                f'ALTER TABLE "{old_name}" RENAME TO "{new_name}"'
            )


class Migration(migrations.Migration):
    dependencies = [
        ('courses', '0002_alter_testcase_options'),
    ]

    operations = [
        migrations.RunPython(rename_legacy_tables, migrations.RunPython.noop),
    ]
