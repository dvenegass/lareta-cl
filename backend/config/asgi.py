"""
Punto de entrada ASGI: atiende peticiones HTTP normales y WebSockets.

- HTTP      → Django de siempre (vistas, API, admin).
- WebSocket → consumidores de Channels (chat de grupos), con la sesión
  de Django para saber quién se conecta.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

# Hay que cargar Django antes de importar algo que use modelos.
django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import AllowedHostsOriginValidator  # noqa: E402

from apps.chat.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        # AllowedHostsOriginValidator rechaza conexiones abiertas desde otros sitios.
        "websocket": AllowedHostsOriginValidator(AuthMiddlewareStack(URLRouter(websocket_urlpatterns))),
    }
)
