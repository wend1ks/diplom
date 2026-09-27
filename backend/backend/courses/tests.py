from rest_framework import status
from rest_framework.test import APITestCase

from users.models import CustomUser

from .models import Course, Lesson, Module, TestCase


class TestCaseApiPermissionsTests(APITestCase):
    def setUp(self):
        self.student = CustomUser.objects.create_user('student', password='safe-password')
        self.teacher = CustomUser.objects.create_user(
            'teacher', password='safe-password', role='teacher'
        )
        course = Course.objects.create(
            title='Python', slug='python', author=self.teacher
        )
        module = Module.objects.create(course=course, title='Основы', order=1)
        lesson = Lesson.objects.create(module=module, title='Переменные', order=1)
        TestCase.objects.create(
            lesson=lesson, input_data='x=2', expected_output='4', order=1
        )

    def test_student_cannot_read_expected_answers(self):
        self.client.force_authenticate(self.student)
        response = self.client.get('/api/testcases/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_can_manage_test_cases(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.get('/api/testcases/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['expected_output'], '4')
