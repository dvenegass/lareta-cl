from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .serializers import (
    CurrentUserSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
)
from .services import register_user, reset_password, send_password_reset_email, update_profile


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    """El frontend llama aquí al arrancar para recibir la cookie `csrftoken`."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = register_user(**serializer.validated_data)
        login(request, user)

        data = CurrentUserSerializer(user, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(request, **serializer.validated_data)
        if user is None:
            raise serializers.ValidationError(
                {"detail": "Usuario o contraseña incorrectos."}
            )
        login(request, user)

        return Response(CurrentUserSerializer(user, context={"request": request}).data)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetRequestView(APIView):
    """Paso 1: pedir el enlace por email. Responde siempre igual, exista o no el email."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        send_password_reset_email(email=serializer.validated_data["email"])

        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetConfirmView(APIView):
    """Paso 2: elegir la nueva contraseña con el enlace del email. Deja la sesión iniciada."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = reset_password(
            user=serializer.validated_data["user"],
            new_password=serializer.validated_data["new_password"],
        )
        login(request, user)

        return Response(CurrentUserSerializer(user, context={"request": request}).data)


class MeView(APIView):
    """Perfil del usuario con sesión iniciada."""

    def get(self, request):
        return Response(CurrentUserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = CurrentUserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        user = update_profile(user=request.user, **serializer.validated_data)

        return Response(CurrentUserSerializer(user, context={"request": request}).data)
