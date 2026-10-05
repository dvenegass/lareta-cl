"""
Pruebas del WebSocket. Se usa TransactionTestCase porque el consumidor
lee la base de datos desde otro hilo (no vería los datos de una transacción
de prueba sin confirmar) y para que `transaction.on_commit` se ejecute.
"""

from channels.db import database_sync_to_async
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import AnonymousUser
from django.test import TransactionTestCase

from apps.chat import services
from apps.chat.routing import websocket_urlpatterns
from apps.groups.services import create_group, remove_member
from apps.users.models import User

application = URLRouter(websocket_urlpatterns)


class GroupChatConsumerTests(TransactionTestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.group = create_group(owner=self.joni, name="Chilensios", members=[self.diego])

    async def _connect(self, user):
        communicator = WebsocketCommunicator(application, f"/ws/groups/{self.group.pk}/chat/")
        communicator.scope["user"] = user  # en la app real lo pone AuthMiddlewareStack
        connected, _ = await communicator.connect()
        return communicator, connected

    async def test_member_receives_new_messages_with_own_permissions(self):
        joni, connected = await self._connect(self.joni)
        diego, _ = await self._connect(self.diego)
        self.assertTrue(connected)

        await database_sync_to_async(services.send_message)(group=self.group, author=self.diego, body="Hola")

        for_diego = await diego.receive_json_from()
        for_joni = await joni.receive_json_from()
        self.assertEqual(for_diego["type"], "message.created")
        self.assertEqual(for_diego["message"]["body"], "Hola")
        self.assertTrue(for_diego["message"]["can_delete"])  # lo escribió
        self.assertTrue(for_joni["message"]["can_delete"])  # administra el grupo
        await joni.disconnect()
        await diego.disconnect()

    async def test_deleted_messages_are_announced(self):
        diego, _ = await self._connect(self.diego)
        message = await database_sync_to_async(services.send_message)(
            group=self.group, author=self.diego, body="Ups"
        )
        await diego.receive_json_from()
        message_id = message.id  # Django lo deja en None al borrar

        await database_sync_to_async(services.delete_message)(message=message)

        self.assertEqual(await diego.receive_json_from(), {"type": "message.deleted", "id": message_id})
        await diego.disconnect()

    async def test_outsiders_and_anonymous_are_rejected(self):
        _, ana_connected = await self._connect(self.ana)
        _, anon_connected = await self._connect(AnonymousUser())

        self.assertFalse(ana_connected)
        self.assertFalse(anon_connected)

    async def test_typing_reaches_others_but_not_sender(self):
        joni, _ = await self._connect(self.joni)
        diego, _ = await self._connect(self.diego)

        await diego.send_json_to({"type": "typing"})

        self.assertEqual(
            await joni.receive_json_from(), {"type": "typing", "user": {"id": self.diego.id, "username": "diego"}}
        )
        self.assertTrue(await diego.receive_nothing())
        await joni.disconnect()
        await diego.disconnect()

    async def test_removed_member_gets_disconnected(self):
        diego, _ = await self._connect(self.diego)
        await database_sync_to_async(remove_member)(group=self.group, user=self.diego)

        await database_sync_to_async(services.send_message)(group=self.group, author=self.joni, body="Chao")

        output = await diego.receive_output()
        self.assertEqual(output["type"], "websocket.close")
