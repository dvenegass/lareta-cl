"""
Configuración común a todos los entornos.

Los valores que cambian entre entornos (claves, base de datos, hosts...)
se leen de variables de entorno o del archivo `.env`.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

INSTALLED_APPS = [
    # Daphne va primero: hace que `runserver` sirva también WebSockets (ASGI).
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceros
    "rest_framework",
    "channels",
    # Apps del proyecto
    "apps.users",
    "apps.friends",
    "apps.groups",
    "apps.events",
    "apps.polls",
    "apps.expenses",
    "apps.stats",
    "apps.profiles",
    "apps.notifications",
    "apps.bringlist",
    "apps.comments",
    "apps.chat",
    "apps.photos",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
# ASGI = HTTP + WebSockets (ver config/asgi.py)
ASGI_APPLICATION = "config.asgi.application"

# "Capa de canales": por donde un proceso avisa a los WebSockets abiertos que
# llegó un mensaje. En memoria basta con un solo proceso (desarrollo); con
# varios procesos (producción) hace falta Redis: REDIS_URL=redis://localhost:6379
REDIS_URL = env("REDIS_URL", default="")
if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [REDIS_URL]},
        }
    }
else:
    CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {"default": env.db("DATABASE_URL")}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "users.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es"
TIME_ZONE = env("TIME_ZONE", default="America/Santiago")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# El frontend usa la sesión de Django (cookie HttpOnly) + token CSRF.
# Por defecto, todos los endpoints requieren usuario autenticado.
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    # Límite de peticiones para endpoints sensibles (por IP, ver ScopedRateThrottle).
    "DEFAULT_THROTTLE_RATES": {
        "password_reset": "5/hour",
    },
}

# GIFs del chat (https://partner.klipy.com). Sin clave, el buscador de GIFs se desactiva.
KLIPY_API_KEY = env("KLIPY_API_KEY", default="")

# Dirección del frontend: se usa para armar los enlaces de los emails.
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

# Envío de emails. Por defecto se imprimen en la consola de Django (desarrollo).
# En producción: EMAIL_URL=smtp+tls://usuario:clave@smtp.servidor.com:587
vars().update(env.email_url("EMAIL_URL", default="consolemail://"))
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="lareta.cl <no-reply@lareta.cl>")

# Los enlaces para restablecer la contraseña caducan en 1 hora.
PASSWORD_RESET_TIMEOUT = 60 * 60
