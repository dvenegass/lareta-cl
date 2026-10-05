from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.models import EventParticipant
from apps.events.services import create_event
from apps.friends.models import Friendship
from apps.groups.services import create_group
from apps.users.models import User


def upcoming_event(creator, title="Junta"):
    return create_event(
        creator=creator, title=title, starts_at=timezone.now() + timedelta(days=2), location="Parque"
    )


class UserProfileTests(APITestCase):
    def setUp(self):
        self.diego = User.objects.create_user(username="diego", password="x")
        self.joni = User.objects.create_user(username="joni", password="x")
        self.client.force_authenticate(self.diego)

    def profile(self, username="joni"):
        return self.client.get(reverse("user-profile", args=[username]))

    def test_stranger_sees_level_but_not_stats(self):
        response = self.profile()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["relationship"], "none")
        self.assertEqual(response.data["level"]["number"], 1)
        self.assertIsNone(response.data["stats"])

    def test_friends_see_stats_and_common_groups(self):
        Friendship.objects.create(requester=self.diego, addressee=self.joni, status="accepted")
        create_group(owner=self.diego, name="Chilensios", members=[self.joni])
        create_group(owner=self.diego, name="Solo Diego")

        response = self.profile()

        self.assertEqual(response.data["relationship"], "friends")
        self.assertEqual(set(response.data["stats"]), {"attended", "on_time", "events_organized", "places"})
        self.assertEqual([g["name"] for g in response.data["common_groups"]], ["Chilensios"])
        self.assertEqual(response.data["friends_count"], 1)

    def test_pending_request_ids(self):
        request = Friendship.objects.create(requester=self.joni, addressee=self.diego)

        response = self.profile()

        self.assertEqual(response.data["relationship"], "request_received")
        self.assertEqual(response.data["pending_request_id"], request.id)

    def test_only_shared_events_are_listed(self):
        shared = upcoming_event(self.joni, title="Compartida")
        EventParticipant.objects.create(event=shared, user=self.diego, status="going")
        upcoming_event(self.joni, title="Solo de Joni")  # Diego no está: no debe aparecer

        response = self.profile()

        self.assertEqual([e["title"] for e in response.data["shared_upcoming"]], ["Compartida"])

    def test_own_profile(self):
        response = self.profile("diego")

        self.assertEqual(response.data["relationship"], "self")
        self.assertIsNotNone(response.data["stats"])

    def test_unknown_user(self):
        self.assertEqual(self.profile("nadie").status_code, status.HTTP_404_NOT_FOUND)
