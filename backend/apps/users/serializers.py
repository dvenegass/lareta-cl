from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User
from .services import get_user_from_reset_link


class UserSerializer(serializers.ModelSerializer):
    """Datos públicos de un usuario (lo que ven los demás)."""

    class Meta:
        model = User
        fields = ["id", "username", "avatar"]


class CurrentUserSerializer(serializers.ModelSerializer):
    """El usuario con sesión iniciada viendo/editando su propio perfil."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar", "theme_color", "theme_mode", "show_decor"]
        extra_kwargs = {"avatar": {"allow_null": True}}

    def validate_theme_color(self, value):
        return value.lower()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate(self, attrs):
        # Valida la contraseña con las reglas de AUTH_PASSWORD_VALIDATORS.
        candidate = User(username=attrs["username"], email=attrs.get("email", ""))
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": error.messages})
        return attrs


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(style={"input_type": "password"})

    def validate(self, attrs):
        user = get_user_from_reset_link(uid=attrs["uid"], token=attrs["token"])
        if user is None:
            raise serializers.ValidationError({"detail": "El enlace no es válido o ya caducó. Pide uno nuevo."})
        try:
            validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"new_password": error.messages})
        attrs["user"] = user
        return attrs
