from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.services import create_event
from apps.polls.models import Poll
from apps.users.models import User


class PollTests(APITestCase):
    def setUp(self):
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.event = create_event(
            creator=self.diego,
            title="Junta",
            starts_at=timezone.now() + timedelta(days=2),
            location="Casa de Diego",
        )
        self.client.force_authenticate(self.ana)

    def create_poll(self, **extra):
        data = {"question": "¿Dónde hacemos la junta?", "options": ["🏠 Casa de Diego", "🍕 Pizza"], **extra}
        return self.client.post(reverse("event-polls", args=[self.event.pk]), data, format="json")

    def test_create_and_list(self):
        response = self.create_poll()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual([o["text"] for o in response.data["options"]], ["🏠 Casa de Diego", "🍕 Pizza"])
        listed = self.client.get(reverse("event-polls", args=[self.event.pk]))
        self.assertEqual(len(listed.data), 1)

    def test_needs_two_distinct_options(self):
        self.assertEqual(self.create_poll(options=["Pizza", "  "]).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.create_poll(options=["Pizza", "pizza"]).status_code, status.HTTP_400_BAD_REQUEST)

    def test_vote_and_change_vote(self):
        poll = self.create_poll().data
        first, second = poll["options"]
        vote_url = reverse("poll-vote", args=[poll["id"]])

        self.client.put(vote_url, {"option": first["id"]}, format="json")
        response = self.client.put(vote_url, {"option": second["id"]}, format="json")

        self.assertEqual(response.data["my_vote"], second["id"])
        self.assertEqual(response.data["total_votes"], 1)
        self.assertEqual([o["votes"] for o in response.data["options"]], [0, 1])

    def test_cannot_vote_option_from_another_poll(self):
        poll = self.create_poll().data
        other = self.create_poll(question="¿Qué comemos?").data

        response = self.client.put(
            reverse("poll-vote", args=[poll["id"]]), {"option": other["options"][0]["id"]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_permissions(self):
        poll_id = self.create_poll().data["id"]
        stranger = User.objects.create_user(username="beto", password="x")

        self.client.force_authenticate(stranger)
        self.assertEqual(self.client.delete(reverse("poll-detail", args=[poll_id])).status_code, 403)

        self.client.force_authenticate(self.diego)  # organizador de la junta
        self.assertEqual(self.client.delete(reverse("poll-detail", args=[poll_id])).status_code, 204)
        self.assertFalse(Poll.objects.exists())
