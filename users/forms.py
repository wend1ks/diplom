from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser, TeacherRequest
from django import forms

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ("username", "email", "password1", "password2", "user_image")
        widgets = {
            'user_image': forms.FileInput(attrs={'accept': 'image/*'}),
        }

class SignInForm(forms.Form):
    username = forms.CharField(
        label='Логин',
        max_length=150,
        widget=forms.TextInput(attrs={
            'class': 'input is-rounded',
            'placeholder': 'Введите логин'
        })
    )
    password = forms.CharField(
        label='Пароль',
        widget=forms.PasswordInput(attrs={
            'class': 'input is-rounded',
            'placeholder': 'Введите пароль'
        })
    )

class ProfileForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ["first_name", "last_name", "email", "user_image"]


class TeacherRequestForm(forms.ModelForm):
    class Meta:
        model = TeacherRequest
        fields = ("message",)
        widgets = {
            "message": forms.Textarea(attrs={
                "class": "profile-input",
                "rows": 4,
                "placeholder": "Кратко расскажите о вашем опыте и темах, которые хотите преподавать.",
            }),
        }
