"""Operaciones de escritura sobre usuarios (lógica de negocio, sin HTTP)."""

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from .models import User


def register_user(*, username: str, password: str, email: str = "") -> User:
    return User.objects.create_user(username=username, email=email, password=password)


def update_profile(*, user: User, **data) -> User:
    if "avatar" in data:
        new_avatar = data.pop("avatar")
        # Borra el archivo anterior para no acumular imágenes huérfanas.
        if user.avatar:
            user.avatar.delete(save=False)
        user.avatar = new_avatar or ""

    for field, value in data.items():
        setattr(user, field, value)

    user.save()
    return user


# ---------- Recuperar contraseña ----------

RESET_EMAIL_SUBJECT = "Restablece tu contraseña de reta.cl"
RESET_EMAIL_BODY = """Hola, {username}:

Alguien (ojalá tú) pidió restablecer la contraseña de tu cuenta en reta.cl.
Para elegir una nueva, abre este enlace:

{link}

El enlace funciona una sola vez y caduca en 1 hora.
Si no fuiste tú, ignora este email: tu contraseña sigue igual.
"""


def send_password_reset_email(*, email: str) -> None:
    """
    Envía el enlace a cada cuenta activa con ese email.
    Si no hay ninguna no hace nada: la vista responde igual en ambos casos para
    no revelar qué emails están registrados.
    """
    users = User.objects.filter(email__iexact=email, is_active=True)
    for user in users:
        if not user.has_usable_password():
            continue
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
        send_mail(
            subject=RESET_EMAIL_SUBJECT,
            message=RESET_EMAIL_BODY.format(username=user.username, link=link),
            from_email=None,  # usa DEFAULT_FROM_EMAIL
            recipient_list=[user.email],
        )


def get_user_from_reset_link(*, uid: str, token: str) -> User | None:
    """El usuario del enlace, o None si el enlace es inválido, ya se usó o caducó."""
    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return None
    return user if default_token_generator.check_token(user, token) else None


def reset_password(*, user: User, new_password: str) -> User:
    # Al cambiar la contraseña, el token deja de ser válido: el enlace es de un solo uso.
    user.set_password(new_password)
    user.save(update_fields=["password"])
    return user
