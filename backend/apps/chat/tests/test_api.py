import io
import json
import shutil
import tempfile
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from apps.chat.models import GroupMessage
from apps.groups.services import create_group
from apps.users.models import User

TEMP_MEDIA = tempfile.mkdtemp()
KLIPY_GIF = "https://static.klipy.com/ii/abc/fiesta.gif"


def make_image(size=(2400, 1200), image_format="PNG", name="foto.png", content_type="image/png"):
    buffer = io.BytesIO()
    Image.new("RGB", size, "orange").save(buffer, format=image_format)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)


class GroupChatApiTests(APITestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.group = create_group(owner=self.joni, name="Chilensios", members=[self.diego])
        self.url = reverse("group-messages", args=[self.group.pk])

    def test_members_send_and_read_in_order(self):
        self.client.force_authenticate(self.diego)
        self.client.post(self.url, {"body": "¿Pichanga el lunes?"})
        self.client.post(self.url, {"body": "Yo llevo la pelota"})

        response = self.client.get(self.url)

        self.assertEqual([m["body"] for m in response.data], ["¿Pichanga el lunes?", "Yo llevo la pelota"])
        self.assertEqual(response.data[0]["author"]["username"], "diego")
        self.assertTrue(response.data[0]["can_delete"])

    def test_outsiders_cannot_read_or_write(self):
        self.client.force_authenticate(self.ana)

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.post(self.url, {"body": "Hola"}).status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_message_rejected(self):
        self.client.force_authenticate(self.diego)

        self.assertEqual(self.client.post(self.url, {"body": "   "}).status_code, status.HTTP_400_BAD_REQUEST)

    def test_after_and_before_pagination(self):
        ids = [
            GroupMessage.objects.create(group=self.group, author=self.joni, body=f"m{i}").id for i in range(5)
        ]
        self.client.force_authenticate(self.diego)

        after = self.client.get(self.url, {"after": ids[2]}).data
        before = self.client.get(self.url, {"before": ids[2]}).data

        self.assertEqual([m["body"] for m in after], ["m3", "m4"])
        self.assertEqual([m["body"] for m in before], ["m0", "m1"])

    def test_delete_by_author_or_owner_only(self):
        message = GroupMessage.objects.create(group=self.group, author=self.diego, body="Hola")
        url = reverse("group-message-detail", args=[message.pk])
        other = GroupMessage.objects.create(group=self.group, author=self.joni, body="Chao")

        self.client.force_authenticate(self.diego)
        self.assertEqual(
            self.client.delete(reverse("group-message-detail", args=[other.pk])).status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.client.force_authenticate(self.joni)  # administra el grupo
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupMessage.objects.filter(pk=message.pk).exists())


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class ChatAttachmentsTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.diego = User.objects.create_user(username="diego", password="x")
        self.group = create_group(owner=self.diego, name="Chilensios")
        self.url = reverse("group-messages", args=[self.group.pk])
        self.client.force_authenticate(self.diego)

    def test_image_is_saved_and_downscaled(self):
        response = self.client.post(self.url, {"image": make_image()}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual((response.data["image_width"], response.data["image_height"]), (1600, 800))
        self.assertTrue(response.data["image"])

    def test_image_with_caption(self):
        response = self.client.post(self.url, {"body": "Mira", "image": make_image((50, 50))}, format="multipart")

        self.assertEqual(response.data["body"], "Mira")

    def test_rejects_non_images(self):
        fake = SimpleUploadedFile("virus.png", b"no soy una imagen", content_type="image/png")

        response = self.client.post(self.url, {"image": fake}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_gif_from_klipy(self):
        response = self.client.post(
            self.url, {"gif_url": KLIPY_GIF, "gif_width": 320, "gif_height": 240}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["gif_url"], KLIPY_GIF)

    def test_rejects_gifs_from_other_sites(self):
        response = self.client.post(self.url, {"gif_url": "https://malo.example.com/x.gif"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_image_and_gif_together(self):
        response = self.client.post(
            self.url, {"image": make_image((50, 50)), "gif_url": KLIPY_GIF}, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deleting_removes_the_file(self):
        message_id = self.client.post(self.url, {"image": make_image((50, 50))}, format="multipart").data["id"]
        message = GroupMessage.objects.get(pk=message_id)
        storage, name = message.image.storage, message.image.name

        self.client.delete(reverse("group-message-detail", args=[message_id]))

        self.assertFalse(storage.exists(name))


class GifSearchTests(APITestCase):
    def setUp(self):
        self.client.force_authenticate(User.objects.create_user(username="diego", password="x"))
        self.url = reverse("gif-search")

    @override_settings(KLIPY_API_KEY="")
    def test_unavailable_without_api_key(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    @override_settings(KLIPY_API_KEY="clave-de-prueba")
    def test_search_simplifies_klipy_response(self):
        klipy_response = {
            "result": True,
            "data": {
                "has_next": True,
                "data": [
                    {
                        "id": 7,
                        "title": "Fiesta",
                        "file": {
                            "md": {"gif": {"url": KLIPY_GIF, "width": 320, "height": 240}},
                            "sm": {"gif": {"url": "https://static.klipy.com/sm.gif", "width": 160, "height": 120}},
                        },
                    },
                    {"id": 8, "title": "Sin archivos", "file": {}},
                ],
            },
        }
        fake_response = io.BytesIO(json.dumps(klipy_response).encode())

        with patch("apps.chat.gifs.urlopen", return_value=fake_response) as urlopen:
            response = self.client.get(self.url, {"q": "fiesta"})

        requested_url = urlopen.call_args.args[0].full_url
        self.assertIn("/clave-de-prueba/gifs/search?", requested_url)
        self.assertIn("q=fiesta", requested_url)
        self.assertTrue(response.data["has_next"])
        self.assertEqual(len(response.data["results"]), 1)  # el que no tiene archivos se descarta
        self.assertEqual(response.data["results"][0]["url"], KLIPY_GIF)
        self.assertEqual(response.data["results"][0]["preview_url"], "https://static.klipy.com/sm.gif")
