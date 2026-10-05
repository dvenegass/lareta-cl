"""Configuración para producción. Todos los secretos vienen del entorno."""

from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False
SECRET_KEY = env("SECRET_KEY")

# Cookies solo por HTTPS.
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
# Necesario si la app corre detrás de un proxy (Nginx, Render, Railway...).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
