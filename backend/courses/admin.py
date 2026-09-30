from django.contrib import admin
from .models import Assignment, AssignmentSubmission, Course, Lesson, Module

admin.site.register(Assignment)
admin.site.register(AssignmentSubmission)
admin.site.register(Course)
admin.site.register(Module)
admin.site.register(Lesson)
