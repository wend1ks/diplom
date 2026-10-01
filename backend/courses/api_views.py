from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import (
    Assignment,
    AssignmentSubmission,
    Course,
    Lesson,
    LessonProgress,
    Module,
    TestCase,
)
from .serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
    CourseSerializer,
    LessonProgressSerializer,
    LessonSerializer,
    ModuleSerializer,
    TestCaseSerializer,
)
from .code_runner import parse_testcase_input, run_user_code


def is_limited_teacher(user):
    return bool(user.is_authenticated and user.role == 'teacher')


def restrict_to_owned_courses(queryset, user, course_path=''):
    if is_limited_teacher(user):
        return queryset.filter(**{f'{course_path}author': user})
    return queryset


def readable_courses_queryset(queryset, request, course_path=''):
    if request.method in permissions.SAFE_METHODS:
        return queryset
    return restrict_to_owned_courses(queryset, request.user, course_path)


def require_owned_course(request, course):
    if is_limited_teacher(request.user) and course.author_id != request.user.id:
        raise permissions.PermissionDenied('Можно работать только со своими курсами.')

def next_order(queryset):
    current_order = queryset.order_by('-order').values_list('order', flat=True).first()
    return 1 if current_order is None else current_order + 1

class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.role in ('admin', 'teacher'))
        )


class ReadOnlyOrTeacherAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsTeacherOrAdmin().has_permission(request, view)


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = (ReadOnlyOrTeacherAdmin,)
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Course.objects.select_related('author').prefetch_related(
            'modules__lessons__testcases',
            'assignments',
        ).order_by('id')
        return readable_courses_queryset(queryset, self.request)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = (ReadOnlyOrTeacherAdmin,)

    def get_queryset(self):
        queryset = Module.objects.select_related('course').prefetch_related(
            'lessons__testcases'
        )
        return readable_courses_queryset(queryset, self.request, 'course__')

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        require_owned_course(self.request, course)
        order = serializer.validated_data.get('order')
        if order is None:
            order = next_order(Module.objects.filter(course=course))
        serializer.save(order=order)

    def perform_update(self, serializer):
        require_owned_course(self.request, serializer.validated_data.get('course', serializer.instance.course))
        serializer.save()


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = (ReadOnlyOrTeacherAdmin,)

    def get_queryset(self):
        queryset = Lesson.objects.select_related('module__course').prefetch_related(
            'testcases'
        )
        return readable_courses_queryset(queryset, self.request, 'module__course__')

    def perform_create(self, serializer):
        module = serializer.validated_data['module']
        require_owned_course(self.request, module.course)
        order = serializer.validated_data.get('order')
        if order is None:
            order = next_order(Lesson.objects.filter(module=module))
        serializer.save(order=order)

    def perform_update(self, serializer):
        module = serializer.validated_data.get('module', serializer.instance.module)
        require_owned_course(self.request, module.course)
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        lesson = self.get_object()
        if request.user.is_authenticated and lesson.lesson_type in ('text', 'video'):
            progress, _ = LessonProgress.objects.get_or_create(
                user=request.user, lesson=lesson,
            )
            if not progress.is_completed:
                progress.is_completed = True
                progress.save(update_fields=('is_completed', 'last_attempt'))
        return Response(self.get_serializer(lesson).data)


class TestCaseViewSet(viewsets.ModelViewSet):
    serializer_class = TestCaseSerializer
    permission_classes = (IsTeacherOrAdmin,)

    def get_queryset(self):
        queryset = TestCase.objects.select_related('lesson__module__course')
        return readable_courses_queryset(queryset, self.request, 'lesson__module__course__')

    def perform_create(self, serializer):
        lesson = serializer.validated_data['lesson']
        require_owned_course(self.request, lesson.module.course)
        order = serializer.validated_data.get('order')
        if order is None:
            order = next_order(TestCase.objects.filter(lesson=lesson))
        serializer.save(order=order)

    def perform_update(self, serializer):
        lesson = serializer.validated_data.get('lesson', serializer.instance.lesson)
        require_owned_course(self.request, lesson.module.course)
        serializer.save()


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = (ReadOnlyOrTeacherAdmin,)

    def get_queryset(self):
        queryset = Assignment.objects.select_related('course').prefetch_related(
            'submissions'
        )
        return readable_courses_queryset(queryset, self.request, 'course__')

    def perform_create(self, serializer):
        require_owned_course(self.request, serializer.validated_data['course'])
        serializer.save()

    def perform_update(self, serializer):
        require_owned_course(self.request, serializer.validated_data.get('course', serializer.instance.course))
        serializer.save()


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = AssignmentSubmission.objects.select_related(
            'assignment__course',
            'student',
            'reviewed_by',
        )
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        if is_limited_teacher(self.request.user):
            return queryset.filter(assignment__course__author=self.request.user)
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return queryset
        return queryset.filter(student=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise serializers.ValidationError(
                {'detail': 'Отправлять работу могут только ученики.'}
            )
        assignment = serializer.validated_data['assignment']
        if not serializer.validated_data.get('answer', '').strip():
            raise serializers.ValidationError(
                {'answer': 'Добавьте комментарий к работе.'}
            )
        if not serializer.validated_data.get('attachment'):
            raise serializers.ValidationError(
                {'attachment': 'Прикрепите файл с выполненной работой.'}
            )
        if AssignmentSubmission.objects.filter(
            assignment=assignment,
            student=self.request.user,
        ).exists():
            raise serializers.ValidationError(
                {'detail': 'Работа по этому заданию уже отправлена.'}
            )
        serializer.save(student=self.request.user)

    def perform_update(self, serializer):
        if not (
            self.request.user.is_staff
            or self.request.user.role in ('admin', 'teacher')
        ):
            raise permissions.PermissionDenied(
                'Изменять отправленные работы может только преподаватель.'
            )
        assignment = serializer.validated_data.get('assignment', serializer.instance.assignment)
        require_owned_course(self.request, assignment.course)
        score = serializer.validated_data.get('score', serializer.instance.score)
        teacher_comment = serializer.validated_data.get(
            'teacher_comment', serializer.instance.teacher_comment
        ).strip()
        if score is None:
            raise serializers.ValidationError(
                {'score': 'Поставьте оценку от 1 до 5.'}
            )
        if not teacher_comment:
            raise serializers.ValidationError(
                {'teacher_comment': 'Напишите комментарий к работе.'}
            )
        serializer.save(
            reviewed_by=self.request.user,
            status=AssignmentSubmission.Status.REVIEWED,
            reviewed_at=timezone.now(),
        )


class LessonProgressViewSet(viewsets.ModelViewSet):
    serializer_class = LessonProgressSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ('get', 'post', 'patch', 'put', 'head', 'options')

    def get_queryset(self):
        queryset = LessonProgress.objects.filter(user=self.request.user).select_related(
            'lesson__module__course'
        )
        return readable_courses_queryset(queryset, self.request, 'lesson__module__course__')

    def perform_create(self, serializer):
        require_owned_course(self.request, serializer.validated_data['lesson'].module.course)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        lesson = serializer.validated_data.get('lesson', serializer.instance.lesson)
        require_owned_course(self.request, lesson.module.course)
        serializer.save(user=self.request.user)


class LessonRunAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.prefetch_related('testcases').get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'detail': 'Урок не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if is_limited_teacher(request.user):
            require_owned_course(request, lesson.module.course)

        code = (request.data.get('code') or '').strip()
        if not code:
            return Response(
                {'detail': 'Код не может быть пустым.', 'result': 'fail'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if lesson.lesson_type != 'task':
            return Response(
                {'detail': 'Code checking is available only for task lessons.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        testcases = list(lesson.testcases.all().order_by('order'))
        if not testcases:
            return Response(
                {'detail': 'This task has no test cases yet.'},
                status=status.HTTP_409_CONFLICT,
            )

        feedback = []
        all_passed = True
        for testcase in testcases:
            inputs, stdin_data = parse_testcase_input(testcase.input_data)
            run_result = run_user_code(code, inputs, timeout=5, stdin_data=stdin_data)
            error = (run_result.get('error') or '').strip()
            output = (run_result.get('output') or '').strip()
            expected = testcase.expected_output.strip()
            passed = False if error else output == expected
            if not passed and not error:
                try:
                    passed = float(output) == float(expected)
                except (TypeError, ValueError):
                    passed = False
            all_passed = all_passed and passed
            feedback.append({
                'input': testcase.input_data,
                'expected': expected,
                'output': error or output,
                'passed': passed,
            })

        progress, _ = LessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson,
        )
        if all_passed:
            progress.is_completed = True
            progress.save(update_fields=('is_completed', 'last_attempt'))

        return Response({
            'result': 'success' if all_passed else 'fail',
            'feedback': feedback,
            'progress': LessonProgressSerializer(progress).data,
        })
