from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import TeacherRequest


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    user_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'user_image',
            'github_id',
        )
        read_only_fields = ('id', 'role', 'github_id')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class TeacherRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TeacherRequest
        fields = (
            'id',
            'user',
            'message',
            'status',
            'created_at',
            'reviewed_at',
        )
        read_only_fields = ('id', 'user', 'status', 'created_at', 'reviewed_at')

