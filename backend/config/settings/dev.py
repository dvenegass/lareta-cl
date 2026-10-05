"""Configuración para desarrollo local."""

from .base import *  # noqa: F401,F403
from .base import env

DEBUG = env.bool("DEBUG", default=True)
SECRET_KEY = env("SECRET_KEY", default="dev-insecure-secret-key")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:5173"])
