"""
WebSocket del chat de un grupo: ws://<host>/ws/groups/<id>/chat/

Los mensajes se envían por la API REST (que valida y guarda); por aquí
solo llegan los avisos en tiempo real:
  - {"type": "message.created", "message": {...}}
  - {"type": "message.deleted", "id": 123}
  - {"type": "typing", "user": {"id": 1, "username": "ana"}}

El navegador puede mandar {"type": "typing"} mientras escribe, y se
reenvía a los demás para mostrar "ana está escribiendo…".
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from . import realtime, selectors

# Código de cierre propio para "no tienes acceso a este chat".
CLOSE_FORBIDDEN = 4403


class GroupChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.group_id = int(self.scope["url_route"]["kwargs"]["group_id"])
        self.room = realtime.room_name(self.group_id)

        if not self.user.is_authenticated or await self._access() is None:
            await self.close(code=CLOSE_FORBIDDEN)
            return

        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "typing":
            await self.channel_layer.group_send(
                self.room,
                {
                    "type": "chat.typing",
                    "user": {"id": self.user.id, "username": self.user.username},
                    "sender": self.channel_name,
                },
            )

    # ----- Avisos que llegan desde la sala (realtime.broadcast) -----

    async def chat_event(self, event):
        # Se revisa en cada aviso: si sacaron a la persona del grupo, se le cierra el chat.
        access = await self._access()
        if access is None:
            await self.close(code=CLOSE_FORBIDDEN)
            return

        payload = event["payload"]
        if payload["type"] == "message.created":
            message = payload["message"]
            can_delete = message["author"]["id"] == self.user.id or access["is_owner"]
            payload = {**payload, "message": {**message, "can_delete": can_delete}}
        await self.send_json(payload)

    async def chat_typing(self, event):
        if event["sender"] != self.channel_name:  # a uno mismo no se le avisa
            await self.send_json({"type": "typing", "user": event["user"]})

    @database_sync_to_async
    def _access(self):
        return selectors.chat_access(self.user, self.group_id)
