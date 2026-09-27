import secrets
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .models import TeacherRequest
from .serializers import RegisterSerializer, TeacherRequestSerializer, UserSerializer


User = get_user_model()


def _github_request(method, url, **kwargs):
    """Make GitHub OAuth calls resilient to brief network interruptions."""
    retry = Retry(
        total=2,
        connect=2,
        read=1,
        status=2,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({'GET', 'POST'}),
    )
    with requests.Session() as session:
        session.mount('https://', HTTPAdapter(max_retries=retry))
        return session.request(method, url, timeout=(15, 30), **kwargs)


def _github_is_configured():
    return bool(settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET)


def _github_username(login, github_id):
    """Produce a unique Django username from GitHub's public login."""
    base = ''.join(char if char.isalnum() or char in '._-' else '_' for char in login)
    base = (base or 'github_user')[:130]
    username = f'{base}_{github_id}'[:150]
    counter = 1
    while User.objects.filter(username=username).exists():
        suffix = f'_{counter}'
        username = f'{base[:150 - len(suffix)]}{suffix}'
        counter += 1
    return username


def _github_user(access_token):
    headers = {
        'Accept': 'application/vnd.github+json',
        'Authorization': f'Bearer {access_token}',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    profile_response = _github_request('GET', 'https://api.github.com/user', headers=headers)
    profile_response.raise_for_status()
    profile = profile_response.json()
    github_id = profile.get('id')
    if not github_id:
        raise ValueError('GitHub did not return a user id.')

    user = User.objects.filter(github_id=github_id).first()
    if user:
        return user

    email = profile.get('email') or ''
    if not email:
        emails_response = _github_request('GET', 'https://api.github.com/user/emails', headers=headers)
        if emails_response.ok:
            emails = emails_response.json()
            primary = next((item for item in emails if item.get('primary') and item.get('verified')), None)
            verified = primary or next((item for item in emails if item.get('verified')), None)
            email = (verified or {}).get('email', '')

    # Link an existing local account only by a verified GitHub email.
    user = User.objects.filter(email__iexact=email).first() if email else None
    if user:
        user.github_id = github_id
        user.save(update_fields=('github_id',))
        return user

    name = (profile.get('name') or '').strip().split(maxsplit=1)
    return User.objects.create_user(
        username=_github_username(profile.get('login', ''), github_id),
        email=email,
        first_name=name[0] if name else '',
        last_name=name[1] if len(name) > 1 else '',
        github_id=github_id,
    )


class GitHubAuthStartAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        if not _github_is_configured():
            return Response({'detail': 'GitHub OAuth is not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        state = secrets.token_urlsafe(32)
        request.session['github_oauth_state'] = state
        params = urlencode({
            'client_id': settings.GITHUB_CLIENT_ID,
            'redirect_uri': settings.GITHUB_REDIRECT_URI,
            'scope': 'read:user user:email',
            'state': state,
        })
        return redirect(f'https://github.com/login/oauth/authorize?{params}')


class GitHubAuthCallbackAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        state = request.query_params.get('state')
        expected_state = request.session.pop('github_oauth_state', None)
        code = request.query_params.get('code')
        if not _github_is_configured() or not state or not secrets.compare_digest(state, expected_state or '') or not code:
            return HttpResponseBadRequest('GitHub authorization could not be verified.')
        try:
            token_response = _github_request(
                'POST',
                'https://github.com/login/oauth/access_token',
                data={
                    'client_id': settings.GITHUB_CLIENT_ID,
                    'client_secret': settings.GITHUB_CLIENT_SECRET,
                    'code': code,
                    'redirect_uri': settings.GITHUB_REDIRECT_URI,
                },
                headers={'Accept': 'application/json'},
            )
            token_response.raise_for_status()
            access_token = token_response.json().get('access_token')
            if not access_token:
                raise ValueError('GitHub did not return an access token.')
            user = _github_user(access_token)
        except (requests.RequestException, ValueError) as error:
            return HttpResponseBadRequest(f'GitHub authorization failed: {error}')

        ticket = signing.dumps({'user_id': user.pk}, salt='github-oauth-ticket', compress=True)
        query = urlencode({'ticket': ticket})
        return redirect(f'{settings.FRONTEND_URL}/#/auth/github/callback?{query}')


class GitHubAuthCompleteAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        ticket = request.data.get('ticket')
        if not ticket:
            return Response({'detail': 'Authentication ticket is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            payload = signing.loads(ticket, salt='github-oauth-ticket', max_age=120)
            user = User.objects.get(pk=payload['user_id'])
        except (signing.BadSignature, User.DoesNotExist, KeyError, TypeError):
            return Response({'detail': 'Authentication ticket is invalid or expired.'}, status=status.HTTP_400_BAD_REQUEST)
        refresh = RefreshToken.for_user(user)
        return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.role == 'admin')
        )


class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class MeAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class TeacherRequestAPIView(generics.ListCreateAPIView):
    serializer_class = TeacherRequestSerializer

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return TeacherRequest.objects.select_related('user', 'reviewed_by')
        return TeacherRequest.objects.filter(user=self.request.user).select_related('user')

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise serializers.ValidationError(
                {'detail': 'Только ученики могут подавать заявку преподавателя.'}
            )
        if TeacherRequest.objects.filter(
            user=self.request.user,
            status=TeacherRequest.Status.PENDING,
        ).exists():
            raise serializers.ValidationError(
                {'detail': 'У вас уже есть заявка на рассмотрении.'}
            )
        serializer.save(user=self.request.user)


class TeacherRequestReviewAPIView(generics.UpdateAPIView):
    queryset = TeacherRequest.objects.select_related('user')
    serializer_class = TeacherRequestSerializer
    permission_classes = (IsAdminRole,)
    http_method_names = ('patch', 'put', 'head', 'options')

    def update(self, request, *args, **kwargs):
        teacher_request = self.get_object()
        decision = request.data.get('status')
        if decision not in (
            TeacherRequest.Status.APPROVED,
            TeacherRequest.Status.REJECTED,
        ):
            return Response(
                {'status': 'Укажите approved или rejected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        teacher_request.status = decision
        teacher_request.reviewed_at = timezone.now()
        teacher_request.reviewed_by = request.user
        if decision == TeacherRequest.Status.APPROVED:
            teacher_request.user.role = 'teacher'
            teacher_request.user.save(update_fields=('role',))
        teacher_request.save(update_fields=('status', 'reviewed_at', 'reviewed_by'))
        return Response(self.get_serializer(teacher_request).data)
