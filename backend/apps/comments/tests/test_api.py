from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.comments.models import Comment
from apps.events.services import create_event
from apps.groups.services import create_group
from apps.users.models import User


class CommentTests(APITestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.event = create_event(
            creator=self.joni, title="PICHANGA", starts_at=timezone.now() + timedelta(days=2), location="Cancha"
        )
        self.url = reverse("event-comments", args=[self.event.pk])

    def test_post_and_list_in_order(self):
        self.client.force_authenticate(self.diego)
        self.client.post(self.url, {"body": "Voy 15 min atrasado"})
        self.client.post(self.url, {"body": "¿Alguien me lleva?"})

        response = self.client.get(self.url)

        self.assertEqual([c["body"] for c in response.data], ["Voy 15 min atrasado", "¿Alguien me lleva?"])
        self.assertEqual(response.data[0]["author"]["username"], "diego")
        self.assertTrue(response.data[0]["can_delete"])

    def test_empty_comment_rejected(self):
        self.client.force_authenticate(self.diego)

        self.assertEqual(self.client.post(self.url, {"body": "   "}).status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_by_author_or_organizer_only(self):
        self.client.force_authenticate(self.diego)
        comment_id = self.client.post(self.url, {"body": "Hola"}).data["id"]
        url = reverse("comment-detail", args=[comment_id])

        self.client.force_authenticate(self.ana)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.joni)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.exists())

    def test_group_event_outsiders_can_read_but_not_write(self):
        group = create_group(owner=self.joni, name="Chilensios")
        self.event.group = group
        self.event.save()
        Comment.objects.create(event=self.event, author=self.joni, body="Llevo la pelota")

        self.client.force_authenticate(self.ana)

        self.assertEqual(len(self.client.get(self.url).data), 1)
        self.assertEqual(self.client.post(self.url, {"body": "Hola"}).status_code, status.HTTP_403_FORBIDDEN)
