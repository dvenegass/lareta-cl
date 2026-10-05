"""
Avisos en tiempo real del chat.

Cada grupo tiene una "sala" en la capa de canales. Todos los WebSockets
abiertos en el chat de ese grupo están suscritos a ella. Cuando alguien
envía o borra un mensaje (por la API REST), `broadcast` lo reenvía a la
sala y cada conexión lo entrega a su navegador (ver consumers.py).
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def room_name(group_id: int) -> str:
    return f"group-chat-{group_id}"


def broadcast(group_id: int, payload: dict) -> None:
    """Envía `payload` a todas las conexiones abiertas del chat del grupo."""
    layer = get_channel_layer()
    if layer is None:  # sin capa de canales configurada: no hay tiempo real
        return
    async_to_sync(layer.group_send)(room_name(group_id), {"type": "chat.event", "payload": payload})
