from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.friends.models import Friendship
from apps.friends.selectors import friend_ids
from apps.users.models import User


class FriendTests(APITestCase):
    def setUp(self):
        self.diego = User.objects.create_user(username="diego", password="x")
        self.joni = User.objects.create_user(username="joni", password="x")
        self.client.force_authenticate(self.diego)

    def send_request(self, username="joni"):
        return self.client.post(reverse("friend-requests"), {"username": username})

    def test_send_and_accept(self):
        self.assertEqual(self.send_request(username="JONI").status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.joni)
        incoming = self.client.get(reverse("friend-requests")).data["incoming"]
        self.assertEqual(incoming[0]["user"]["username"], "diego")

        response = self.client.post(reverse("friend-request-accept", args=[incoming[0]["id"]]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(friend_ids(self.diego), {self.joni.id})
        self.assertEqual(friend_ids(self.joni), {self.diego.id})

    def test_requesting_back_accepts_automatically(self):
        Friendship.objects.create(requester=self.joni, addressee=self.diego)

        response = self.send_request()

        self.assertEqual(response.data["status"], "accepted")
        self.assertEqual(Friendship.objects.count(), 1)

    def test_invalid_requests(self):
        self.assertEqual(self.send_request(username="nadie").status_code, 400)
        self.assertEqual(self.send_request(username="diego").status_code, 400)  # uno mismo
        self.send_request()
        self.assertEqual(self.send_request().status_code, 400)  # repetida

    def test_reject_or_cancel(self):
        self.send_request()
        request_id = Friendship.objects.get().id

        self.client.force_authenticate(self.joni)
        self.assertEqual(self.client.delete(reverse("friend-request-detail", args=[request_id])).status_code, 204)
        self.assertFalse(Friendship.objects.exists())

    def test_only_addressee_can_accept(self):
        self.send_request()

        response = self.client.post(reverse("friend-request-accept", args=[Friendship.objects.get().id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unfriend(self):
        Friendship.objects.create(requester=self.joni, addressee=self.diego, status="accepted")

        response = self.client.delete(reverse("friend-detail", args=[self.joni.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(friend_ids(self.diego), set())

    def test_search_shows_relationship(self):
        ana = User.objects.create_user(username="joanna", password="x")
        Friendship.objects.create(requester=self.diego, addressee=ana)

        response = self.client.get(reverse("friend-search"), {"q": "jo"})

        relationships = {row["user"]["username"]: row["relationship"] for row in response.data}
        self.assertEqual(relationships, {"joanna": "request_sent", "joni": "none"})
        self.assertEqual(self.client.get(reverse("friend-search"), {"q": "j"}).data, [])  # muy corto
