from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, TeacherRequest


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Дополнительная информация", {
            "fields": ("user_image", "role"),
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Дополнительная информация", {
            "fields": ("user_image", "role"),
        }),
    )


@admin.register(TeacherRequest)
class TeacherRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "created_at", "reviewed_by")
    list_filter = ("status",)
    search_fields = ("user__username", "user__email")
