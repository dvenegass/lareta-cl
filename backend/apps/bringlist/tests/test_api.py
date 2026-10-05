from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bringlist.models import BringItem
from apps.events.services import create_event
from apps.groups.services import create_group
from apps.users.models import User


class BringListTests(APITestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.event = create_event(
            creator=self.joni, title="Asado", starts_at=timezone.now() + timedelta(days=2), location="Parque"
        )
        self.url = reverse("event-items", args=[self.event.pk])

    def add(self, user, name="Carbón"):
        self.client.force_authenticate(user)
        return self.client.post(self.url, {"name": name})

    def item_url(self):
        return reverse("item-detail", args=[BringItem.objects.get().id])

    def test_add_and_claim(self):
        response = self.add(self.diego)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data[0]["assigned_to"])

        claimed = self.client.patch(self.item_url(), {"claim": True}, format="json")

        self.assertEqual(claimed.data[0]["assigned_to"]["username"], "diego")
        self.assertTrue(claimed.data[0]["can_release"])

    def test_cannot_take_what_someone_else_brings(self):
        self.add(self.diego)
        self.client.patch(self.item_url(), {"claim": True}, format="json")

        self.client.force_authenticate(self.ana)
        response = self.client.patch(self.item_url(), {"claim": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_release_only_by_owner_or_organizer(self):
        self.add(self.diego)
        self.client.patch(self.item_url(), {"claim": True}, format="json")

        self.client.force_authenticate(self.ana)
        self.assertEqual(self.client.patch(self.item_url(), {"claim": False}, format="json").status_code, 403)

        self.client.force_authenticate(self.joni)  # organizador
        released = self.client.patch(self.item_url(), {"claim": False}, format="json")
        self.assertIsNone(released.data[0]["assigned_to"])

    def test_delete_permissions(self):
        self.add(self.diego)

        self.client.force_authenticate(self.ana)
        self.assertEqual(self.client.delete(self.item_url()).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.diego)
        self.assertEqual(self.client.delete(self.item_url()).data, [])

    def test_group_event_only_members(self):
        group = create_group(owner=self.joni, name="Chilensios")
        self.event.group = group
        self.event.save()

        self.assertEqual(self.add(self.ana).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.add(self.joni).status_code, status.HTTP_201_CREATED)
