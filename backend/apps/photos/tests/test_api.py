import io
import shutil
import tempfile
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.services import create_event
from apps.groups.services import create_group
from apps.photos.models import EventPhoto
from apps.users.models import User

TEMP_MEDIA = tempfile.mkdtemp()


def make_image(name="asado.jpg"):
    buffer = io.BytesIO()
    Image.new("RGB", (3000, 2000), "tomato").save(buffer, format="JPEG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/jpeg")


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class EventPhotosTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.event = create_event(
            creator=self.joni, title="Asado", starts_at=timezone.now() - timedelta(hours=2), location="Casa"
        )
        self.url = reverse("event-photos", args=[self.event.pk])

    def _upload(self, user, url=None):
        self.client.force_authenticate(user)
        return self.client.post(url or self.url, {"image": make_image()}, format="multipart")

    def test_upload_downscales_and_lists(self):
        response = self._upload(self.diego)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual((response.data["width"], response.data["height"]), (1600, 1067))
        self.assertEqual(response.data["uploaded_by"]["username"], "diego")
        self.assertEqual(len(self.client.get(self.url).data), 1)

    def test_cannot_upload_before_the_event_starts(self):
        future = create_event(
            creator=self.joni, title="Futuro", starts_at=timezone.now() + timedelta(days=1), location="Casa"
        )

        response = self._upload(self.joni, reverse("event-photos", args=[future.pk]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_upload_to_cancelled_events(self):
        self.event.cancelled_at = timezone.now()
        self.event.save()

        self.assertEqual(self._upload(self.joni).status_code, status.HTTP_403_FORBIDDEN)

    def test_group_outsiders_can_see_but_not_upload(self):
        self.event.group = create_group(owner=self.joni, name="Chilensios")
        self.event.save()
        self._upload(self.joni)

        self.client.force_authenticate(self.ana)
        self.assertEqual(len(self.client.get(self.url).data), 1)
        self.assertEqual(self._upload(self.ana).status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_by_uploader_or_organizer_removes_file(self):
        photo_id = self._upload(self.diego).data["id"]
        photo = EventPhoto.objects.get(pk=photo_id)
        storage, name = photo.image.storage, photo.image.name
        url = reverse("photo-detail", args=[photo_id])

        self.client.force_authenticate(self.ana)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.joni)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(storage.exists(name))

    def test_deleting_the_event_removes_photo_files(self):
        photo = EventPhoto.objects.get(pk=self._upload(self.diego).data["id"])
        storage, name = photo.image.storage, photo.image.name

        self.event.delete()

        self.assertFalse(storage.exists(name))

    def test_history_shows_photo_count_and_cover(self):
        self.event.starts_at = timezone.now() - timedelta(days=2)
        self.event.save()
        self._upload(self.joni)
        self._upload(self.joni)

        history = self.client.get(reverse("event-list"), {"scope": "past"}).data

        self.assertEqual(history[0]["photo_count"], 2)
        self.assertIn("/media/photos/", history[0]["cover_image"])
