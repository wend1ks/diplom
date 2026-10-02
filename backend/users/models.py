from django.db import models
from django.contrib.auth.models import AbstractUser




class CustomUser(AbstractUser):
    email = models.EmailField('email address', unique=True)
    github_id = models.BigIntegerField(unique=True, null=True, blank=True)
    user_image = models.ImageField(
        blank=True,
        null=True,
        help_text='Фото профиля (рекомендуемый размер 400x400)',
        upload_to='Users/user_image/'
    )
    USER_ROLES = (
        ("student", "Ученик"),
        ("admin", "Админ"),
        ("teacher", "Преподаватель")
    )
    
    role = models.CharField(max_length=20, choices=USER_ROLES, default="student")
    def is_student(self):
        return self.role == "student"

    def is_admin(self):
        return self.role == "admin"

    def is_teacher(self):
        return self.role == "teacher"


class PasswordResetCode(models.Model):

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='password_reset_code',
    )
    code_hash = models.CharField(max_length=128, blank=True)
    code_expires_at = models.DateTimeField(blank=True, null=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    sent_at = models.DateTimeField(blank=True, null=True)
    reset_token_hash = models.CharField(max_length=128, blank=True)
    reset_expires_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)


class TeacherRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "На рассмотрении"
        APPROVED = "approved", "Одобрена"
        REJECTED = "rejected", "Отклонена"

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="teacher_request",
    )
    message = models.TextField(blank=True, verbose_name="Расскажите о себе")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="reviewed_teacher_requests",
    )

    class Meta:
        ordering = ("-created_at",)
