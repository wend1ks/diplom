from rest_framework import status
from rest_framework.test import APITestCase


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
