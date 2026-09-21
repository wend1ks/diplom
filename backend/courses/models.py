from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.conf import settings


User = get_user_model()




class Course(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='authored_courses',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

class Module(models.Model):
    course = models.ForeignKey(Course, related_name='modules', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

class Lesson(models.Model):
    module = models.ForeignKey(Module, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200, verbose_name='Название')
    lesson_type = models.CharField(
        max_length=20,
        choices=(('text','Текст'),('video','Видео'),('task','Задача')),
        verbose_name='Тип урока',
        default='text'
    )

    content = models.TextField(blank=True, verbose_name='Описание задачи')  
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок выполнения')

    input_description = models.TextField(blank=True, verbose_name='Входные данные')
    output_description = models.TextField(blank=True, verbose_name='Выходные данные')
    code_template = models.TextField(blank=True, verbose_name="Шаблон кода")
    video_url = models.URLField(blank=True, null=True)


class TestCase(models.Model):
    lesson = models.ForeignKey(Lesson, related_name='testcases', on_delete=models.CASCADE)
    input_data = models.TextField(blank=True)
    expected_output = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ('order', 'id')

class LessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='students_lessonprogress', on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, related_name='students_lesson_progress', on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    score = models.FloatField(default=0.0)
    last_attempt = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'lesson')


class Assignment(models.Model):
    course = models.ForeignKey(Course, related_name="assignments", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    deadline = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.title


class AssignmentSubmission(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Отправлена"
        REVIEWED = "reviewed", "Проверена"

    assignment = models.ForeignKey(Assignment, related_name="submissions", on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="assignment_submissions", on_delete=models.CASCADE)
    answer = models.TextField(blank=True, verbose_name="Ваше решение")
    attachment = models.FileField(blank=True, null=True, upload_to="assignment_submissions/")
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.SUBMITTED)
    score = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        choices=[(value, str(value)) for value in range(1, 6)],
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    teacher_comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="reviewed_submissions",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    class Meta:
        unique_together = ("assignment", "student")
        ordering = ("-submitted_at",)

    def __str__(self):
        return f"{self.assignment}: {self.student.username}"

