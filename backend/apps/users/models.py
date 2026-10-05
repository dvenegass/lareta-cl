from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

DEFAULT_THEME_COLOR = "#b9a6f2"  # lavanda


class User(AbstractUser):
    """
    Usuario de la aplicación.

    Hereda todo de Django (username, email, contraseña, etc.). Tener un modelo
    propio desde el inicio permite añadir campos más adelante sin migraciones
    dolorosas.
    """

    class ThemeMode(models.TextChoices):
        LIGHT = "light", "Día"
        DARK = "dark", "Noche"
        SYSTEM = "system", "Automático"

    avatar = models.ImageField(upload_to="avatars/", blank=True)

    # Apariencia: el frontend genera toda la paleta a partir de este color.
    theme_color = models.CharField(
        max_length=7,
        default=DEFAULT_THEME_COLOR,
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$", "Usa un color hexadecimal, p. ej. #b9a6f2.")],
    )
    theme_mode = models.CharField(max_length=10, choices=ThemeMode.choices, default=ThemeMode.SYSTEM)
    show_decor = models.BooleanField("Figuras de fondo", default=True)

    def __str__(self):
        return self.username
