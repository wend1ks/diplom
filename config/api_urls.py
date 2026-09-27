from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from courses.api_views import (
    AssignmentSubmissionViewSet,
    AssignmentViewSet,
    CourseViewSet,
    LessonProgressViewSet,
    LessonViewSet,
    LessonRunAPIView,   
    ModuleViewSet,
    TestCaseViewSet,
)
from users.api_views import (
    MeAPIView,
    GitHubAuthCompleteAPIView,
    GitHubAuthStartAPIView,
    GitHubAuthCallbackAPIView,
    PasswordResetConfirmAPIView,
    PasswordResetRequestAPIView,
    PasswordResetVerifyAPIView,
    RegisterAPIView,
    TeacherRequestAPIView,
    TeacherRequestReviewAPIView,
)


router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')
router.register('modules', ModuleViewSet, basename='module')
router.register('lessons', LessonViewSet, basename='lesson')
router.register('testcases', TestCaseViewSet, basename='testcase')
router.register('assignments', AssignmentViewSet, basename='assignment')
router.register('submissions', AssignmentSubmissionViewSet, basename='submission')
router.register('progress', LessonProgressViewSet, basename='progress')


urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterAPIView.as_view(), name='register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeAPIView.as_view(), name='me'),
    path('auth/password-reset/request/', PasswordResetRequestAPIView.as_view(), name='password_reset_request'),
    path('auth/password-reset/verify/', PasswordResetVerifyAPIView.as_view(), name='password_reset_verify'),
    path('auth/password-reset/confirm/', PasswordResetConfirmAPIView.as_view(), name='password_reset_confirm'),
    path('auth/github/', GitHubAuthStartAPIView.as_view(), name='github_auth_start'),
    path('auth/github/callback/', GitHubAuthCallbackAPIView.as_view(), name='github_auth_callback'),
    path('auth/github/complete/', GitHubAuthCompleteAPIView.as_view(), name='github_auth_complete'),
    path('lessons/<int:lesson_id>/run/', LessonRunAPIView.as_view(), name='lesson-run'),
    path('teacher-requests/', TeacherRequestAPIView.as_view(), name='teacher_requests'),
    path(
        'teacher-requests/<int:pk>/review/',
        TeacherRequestReviewAPIView.as_view(),
        name='teacher_request_review',
    ),
]
