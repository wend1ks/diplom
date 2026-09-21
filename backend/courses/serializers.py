from rest_framework import serializers
from .models import Assignment,AssignmentSubmission,Course,Lesson,LessonProgress,Module, TestCase


def can_manage_course(request, course):
    user = getattr(request, "user", None)
    return bool(
        user
        and user.is_authenticated
        and (user.is_staff or user.role == "admin" or course.author_id == user.id)
    )



class TestCaseSerializer(serializers.ModelSerializer):
    lesson = serializers.PrimaryKeyRelatedField(queryset=Lesson.objects.all())
    can_manage = serializers.SerializerMethodField()

    def get_can_manage(self, testcase):
        return can_manage_course(self.context.get("request"), testcase.lesson.module.course)

    class Meta:
        model = TestCase
        fields = [
            "id",
            "lesson",
            "input_data",
            "expected_output",
            "order",
            "can_manage",
        ]


class LessonSerializer(serializers.ModelSerializer):
    module = serializers.PrimaryKeyRelatedField(queryset=Module.objects.all())
    course_slug = serializers.CharField(source='module.course.slug', read_only=True)
    is_completed = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()

    def get_is_completed(self, lesson):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        return bool(
            user and user.is_authenticated and LessonProgress.objects.filter(
                user=user, lesson=lesson, is_completed=True
            ).exists()
        )

    def get_can_manage(self, lesson):
        return can_manage_course(self.context.get("request"), lesson.module.course)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "module",
            "course_slug",
            "is_completed",
            "can_manage",
            "title",
            "lesson_type",
            "content",
            "order",
            "input_description",
            "output_description",
            "code_template",
            "video_url",
        ]


class ModuleSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    lessons = LessonSerializer(many=True, read_only=True)
    can_manage = serializers.SerializerMethodField()

    def get_can_manage(self, module):
        return can_manage_course(self.context.get("request"), module.course)

    class Meta:
        model = Module
        fields = [
            "id",
            "course",
            "title",
            "order",
            "lessons",
            "can_manage",
        ]


class CourseSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    assignments = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    assignment_progress = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True)
    can_manage = serializers.SerializerMethodField()

    def get_can_manage(self, course):
        return can_manage_course(self.context.get("request"), course)

    def get_progress(self, course):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        total_lessons = Lesson.objects.filter(module__course=course).count()
        total_assignments = course.assignments.count()
        completed_lessons = 0
        reviewed_assignments = 0

        if user and user.is_authenticated:
            completed_lessons = LessonProgress.objects.filter(
                user=user,
                lesson__module__course=course,
                is_completed=True,
            ).count()
            reviewed_assignments = AssignmentSubmission.objects.filter(
                student=user,
                assignment__course=course,
                status=AssignmentSubmission.Status.REVIEWED,
                score__isnull=False,
            ).count()

        total_items = total_lessons + total_assignments
        completed_items = completed_lessons + reviewed_assignments
        return {
            "percent": int(completed_items * 100 / total_items)
            if total_items else 0,
            "completed_items": completed_items,
            "total_items": total_items,
            "completed_lessons": completed_lessons,
            "total_lessons": total_lessons,
            "reviewed_assignments": reviewed_assignments,
            "total_assignments": total_assignments,
        }

    def get_assignment_progress(self, course):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        submission_statuses = {}
        if user and user.is_authenticated:
            submission_statuses = dict(AssignmentSubmission.objects.filter(
                student=user,
                assignment__course=course,
            ).values_list("assignment_id", "status"))
        return [
            {
                "id": assignment.id,
                "title": assignment.title,
                "is_completed": submission_statuses.get(assignment.id) == AssignmentSubmission.Status.REVIEWED,
                "status": submission_statuses.get(assignment.id),
            }
            for assignment in course.assignments.all()
        ]

    class Meta:
        model = Course
        fields = [
            "id",
            "author",
            "title",
            "description",
            "slug",
            "modules",
            "assignments",
            "progress",
            "assignment_progress",
            "can_manage",
        ]


class AssignmentSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    can_manage = serializers.SerializerMethodField()

    def get_can_manage(self, assignment):
        return can_manage_course(self.context.get("request"), assignment.course)

    class Meta:
        model = Assignment
        fields = ("id", "course", "title", "description", "deadline", "created_at", "can_manage")
        read_only_fields = ("id", "created_at")


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)
    reviewed_by = serializers.StringRelatedField(read_only=True)
    attachment_url = serializers.SerializerMethodField()

    def get_attachment_url(self, submission):
        if not submission.attachment:
            return None
        request = self.context.get("request")
        url = submission.attachment.url
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = AssignmentSubmission
        fields = (
            "id",
            "assignment",
            "student",
            "answer",
            "attachment",
            "attachment_url",
            "submitted_at",
            "status",
            "score",
            "teacher_comment",
            "reviewed_at",
            "reviewed_by",
        )
        read_only_fields = (
            "id",
            "student",
            "submitted_at",
            "status",
            "reviewed_at",
            "reviewed_by",
        )

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated and user.role == "student":
            fields["score"].read_only = True
            fields["teacher_comment"].read_only = True
        return fields


class LessonProgressSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = LessonProgress
        fields = ("id", "user", "lesson", "is_completed", "score", "last_attempt")
        read_only_fields = ("id", "user", "last_attempt")
