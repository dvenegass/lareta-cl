from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.events.services import create_event
from apps.users.models import User


class ShareLinkTests(TestCase):
    """Las páginas para compartir son públicas: no requieren sesión."""

    def setUp(self):
        joni = User.objects.create_user(username="joni", password="x")
        self.event = create_event(
            creator=joni,
            title="PICHANGA",
            starts_at=timezone.now() + timedelta(days=3),
            location="DONDE EL LAMPARD",
        )

    def test_share_page_has_preview_tags_and_redirect(self):
        response = self.client.get(reverse("event-share", args=[self.event.pk]))

        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        self.assertIn('<meta property="og:title" content="PICHANGA"', html)
        self.assertIn("DONDE EL LAMPARD", html)
        self.assertIn(f"/share/events/{self.event.pk}/image.png", html)
        self.assertIn(f'url=http://localhost:5173/events/{self.event.pk}"', html)

    def test_preview_image_is_a_png(self):
        response = self.client.get(reverse("event-share-image", args=[self.event.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertTrue(response.content.startswith(b"\x89PNG"))

    def test_unknown_event(self):
        import uuid

        self.assertEqual(self.client.get(reverse("event-share", args=[uuid.uuid4()])).status_code, 404)
