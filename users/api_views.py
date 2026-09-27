import secrets
from datetime import timedelta
from urllib.parse import urlencode
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
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
from .models import PasswordResetCode, TeacherRequest
from .serializers import RegisterSerializer, TeacherRequestSerializer, UserSerializer


User = get_user_model()

PASSWORD_RESET_CODE_TTL_MINUTES = 10
PASSWORD_RESET_TOKEN_TTL_MINUTES = 10
PASSWORD_RESET_RESEND_SECONDS = 60
PASSWORD_RESET_MAX_ATTEMPTS = 5


def _github_request(method, url, **kwargs):
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

    if not email:
        raise ValueError('GitHub account must have a verified email address.')
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


class PasswordResetRequestAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Укажите адрес электронной почты.'}, status=status.HTTP_400_BAD_REQUEST)
        users = User.objects.filter(email__iexact=email, is_active=True)
        if users.count() != 1:
            return Response({'detail': 'Если аккаунт с такой почтой существует, код уже отправлен.'})

        user = users.first()
        now = timezone.now()
        with transaction.atomic():
            reset, _ = PasswordResetCode.objects.select_for_update().get_or_create(user=user)
            if reset.sent_at and (now - reset.sent_at).total_seconds() < PASSWORD_RESET_RESEND_SECONDS:
                return Response({'detail': 'Если аккаунт с такой почтой существует, код уже отправлен.'})

            code = f'{secrets.randbelow(1_000_000):06d}'
            reset.code_hash = make_password(code)
            reset.code_expires_at = now + timedelta(minutes=PASSWORD_RESET_CODE_TTL_MINUTES)
            reset.attempts = 0
            reset.sent_at = now
            reset.reset_token_hash = ''
            reset.reset_expires_at = None
            reset.save()

        try:
            send_mail(
                subject='Код для восстановления пароля',
                message=(
                    f'Ваш код для восстановления пароля: {code}\n\n'
                    f'Он действует {PASSWORD_RESET_CODE_TTL_MINUTES} минут. '
                    'Если вы не запрашивали смену пароля, просто проигнорируйте это письмо.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            reset.delete()
            return Response({'detail': 'Не удалось отправить письмо. Попробуйте позже.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'detail': 'Если аккаунт с такой почтой существует, код уже отправлен.'})


class PasswordResetVerifyAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code = str(request.data.get('code') or '').strip()
        if not email or not (len(code) == 6 and code.isdigit()):
            return Response({'detail': 'Введите корректную почту и 6-значный код.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.filter(email__iexact=email, is_active=True).first()
            reset = PasswordResetCode.objects.select_for_update().filter(user=user).first() if user else None
            now = timezone.now()
            if not reset or not reset.code_expires_at or reset.code_expires_at <= now:
                return Response({'detail': 'Код неверный или срок его действия истёк.'}, status=status.HTTP_400_BAD_REQUEST)
            if reset.attempts >= PASSWORD_RESET_MAX_ATTEMPTS:
                return Response({'detail': 'Превышено число попыток. Запросите новый код.'}, status=status.HTTP_400_BAD_REQUEST)
            if not check_password(code, reset.code_hash):
                reset.attempts += 1
                reset.save(update_fields=('attempts', 'updated_at'))
                return Response({'detail': 'Код неверный или срок его действия истёк.'}, status=status.HTTP_400_BAD_REQUEST)

            reset_token = secrets.token_urlsafe(32)
            reset.code_hash = ''
            reset.code_expires_at = None
            reset.reset_token_hash = make_password(reset_token)
            reset.reset_expires_at = now + timedelta(minutes=PASSWORD_RESET_TOKEN_TTL_MINUTES)
            reset.save()

        return Response({'reset_token': reset_token})


class PasswordResetConfirmAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        reset_token = str(request.data.get('reset_token') or '')
        password = str(request.data.get('password') or '')
        if not email or not reset_token or not password:
            return Response({'detail': 'Заполните все поля.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.filter(email__iexact=email, is_active=True).first()
            reset = PasswordResetCode.objects.select_for_update().filter(user=user).first() if user else None
            now = timezone.now()
            if not reset or not reset.reset_expires_at or reset.reset_expires_at <= now or not check_password(reset_token, reset.reset_token_hash):
                return Response({'detail': 'Сессия восстановления истекла. Запросите новый код.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                validate_password(password, user=user)
            except DjangoValidationError as error:
                return Response({'detail': ' '.join(error.messages)}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(password)
            user.save(update_fields=('password',))
            reset.delete()

        return Response({'detail': 'Пароль успешно изменён.'})


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
