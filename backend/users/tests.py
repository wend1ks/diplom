from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CustomUser


class JwtAuthenticationTests(APITestCase):
    def test_user_can_register_get_tokens_and_read_profile(self):
        credentials = {
            'username': 'new_student',
            'email': 'student@example.com',
            'password': 'strong-password-123',
            'first_name': 'Новый',
            'last_name': 'Ученик',
        }
        register = self.client.post('/api/auth/register/', credentials, format='json')
        self.assertEqual(register.status_code, status.HTTP_201_CREATED)

        token = self.client.post(
            '/api/auth/token/',
            {'username': credentials['username'], 'password': credentials['password']},
            format='json',
        )
        self.assertEqual(token.status_code, status.HTTP_200_OK)
        self.assertIn('access', token.data)
        self.assertIn('refresh', token.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.data['access']}")
        profile = self.client.get('/api/auth/me/')
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data['username'], credentials['username'])


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='reset_user', email='reset@example.com', password='old-password-123',
        )

    def test_user_can_reset_password_with_email_code(self):
        request_code = self.client.post('/api/auth/password-reset/request/', {'email': self.user.email}, format='json')
        self.assertEqual(request_code.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        import re
        code = re.search(r'\b(\d{6})\b', mail.outbox[0].body).group(1)
        verify = self.client.post('/api/auth/password-reset/verify/', {'email': self.user.email, 'code': code}, format='json')
        self.assertEqual(verify.status_code, status.HTTP_200_OK)

        confirm = self.client.post('/api/auth/password-reset/confirm/', {
            'email': self.user.email,
            'reset_token': verify.data['reset_token'],
            'password': 'new-safe-password-456',
        }, format='json')
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)
        self.assertTrue(self.client.login(username=self.user.username, password='new-safe-password-456'))
