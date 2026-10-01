from django.contrib import admin
from .models import Assignment, AssignmentSubmission, Course, Lesson, Module


class ModuleAdmin(admin.ModelAdmin):
    exclude = ('order',)

    def save_model(self, request, obj, form, change):
        if not change:
            last_order = Module.objects.filter(course=obj.course).order_by('-order').values_list('order', flat=True).first()
            obj.order = 1 if last_order is None else last_order + 1
        super().save_model(request, obj, form, change)


class LessonAdmin(admin.ModelAdmin):
    exclude = ('order',)

    def save_model(self, request, obj, form, change):
        if not change:
            last_order = Lesson.objects.filter(module=obj.module).order_by('-order').values_list('order', flat=True).first()
            obj.order = 1 if last_order is None else last_order + 1
        super().save_model(request, obj, form, change)


admin.site.register(Assignment)
admin.site.register(AssignmentSubmission)
admin.site.register(Course)
admin.site.register(Module, ModuleAdmin)
admin.site.register(Lesson, LessonAdmin)