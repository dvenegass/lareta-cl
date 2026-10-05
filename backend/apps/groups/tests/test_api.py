import tempfile
from datetime import timedelta
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.models import EventParticipant
from apps.events.services import create_event
from apps.friends.models import Friendship
from apps.groups.models import Group, GroupMembership
from apps.groups.services import create_group
from apps.polls.services import create_poll
from apps.users.models import User


def befriend(a, b):
    Friendship.objects.create(requester=a, addressee=b, status="accepted")


class GroupTests(APITestCase):
    def setUp(self):
        self.diego = User.objects.create_user(username="diego", password="x")
        self.joni = User.objects.create_user(username="joni", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        befriend(self.diego, self.joni)
        self.client.force_authenticate(self.diego)

    def test_create_with_friends(self):
        response = self.client.post(
            reverse("group-list"), {"name": "Chilensios", "member_ids": [self.joni.id]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_owner"])
        self.assertEqual({m["user"]["username"] for m in response.data["members"]}, {"diego", "joni"})
        listed = self.client.get(reverse("group-list")).data
        self.assertEqual(listed[0]["member_count"], 2)

    def test_cannot_add_non_friends(self):
        response = self.client.post(
            reverse("group-list"), {"name": "Chilensios", "member_ids": [self.ana.id]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_any_member_adds_their_friends(self):
        group = create_group(owner=self.diego, name="Chilensios", members=[self.joni])
        befriend(self.joni, self.ana)
        self.client.force_authenticate(self.joni)

        response = self.client.post(reverse("group-members", args=[group.id]), {"user_id": self.ana.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(GroupMembership.objects.filter(group=group, user=self.ana).exists())

    def test_only_members_can_see(self):
        group = create_group(owner=self.diego, name="Chilensios")
        self.client.force_authenticate(self.ana)

        self.assertEqual(self.client.get(reverse("group-detail", args=[group.id])).status_code, 404)

    def test_owner_removes_but_members_cannot(self):
        group = create_group(owner=self.diego, name="Chilensios", members=[self.joni])
        self.client.force_authenticate(self.joni)
        url = reverse("group-member-detail", args=[group.id, self.diego.id])
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.diego)
        response = self.client.delete(reverse("group-member-detail", args=[group.id, self.joni.id]))

        self.assertEqual(len(response.data["members"]), 1)

    def test_owner_leaving_passes_ownership(self):
        group = create_group(owner=self.diego, name="Chilensios", members=[self.joni])

        response = self.client.delete(reverse("group-member-detail", args=[group.id, self.diego.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        group.refresh_from_db()
        self.assertEqual(group.owner, self.joni)

    def test_last_member_leaving_deletes_group(self):
        group = create_group(owner=self.diego, name="Solo yo")

        self.client.delete(reverse("group-member-detail", args=[group.id, self.diego.id]))

        self.assertFalse(Group.objects.exists())


def make_image(name="foto.png"):
    """Un PNG real y pequeño para subir en los tests."""
    buffer = BytesIO()
    Image.new("RGB", (20, 20), "pink").save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class GroupPhotoTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="joni", password="x")
        self.member = User.objects.create_user(username="diego", password="x")
        befriend(self.owner, self.member)
        self.group = create_group(owner=self.owner, name="Chilensios", members=[self.member])
        self.url = reverse("group-detail", args=[self.group.id])

    def test_owner_uploads_and_removes_photo(self):
        self.client.force_authenticate(self.owner)

        uploaded = self.client.patch(self.url, {"photo": make_image()}, format="multipart")
        self.assertEqual(uploaded.status_code, status.HTTP_200_OK)
        self.assertIn("/media/groups/", uploaded.data["photo"])

        removed = self.client.patch(self.url, {"photo": None}, format="json")
        self.assertIsNone(removed.data["photo"])

    def test_members_cannot_change_photo(self):
        self.client.force_authenticate(self.member)

        response = self.client.patch(self.url, {"photo": make_image()}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejects_files_that_are_not_images(self):
        self.client.force_authenticate(self.owner)
        fake = SimpleUploadedFile("virus.png", b"no soy una imagen", content_type="image/png")

        response = self.client.patch(self.url, {"photo": fake}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_photo_shows_in_group_list(self):
        self.client.force_authenticate(self.owner)
        self.client.patch(self.url, {"photo": make_image()}, format="multipart")

        self.client.force_authenticate(self.member)
        listed = self.client.get(reverse("group-list")).data

        self.assertIn("/media/groups/", listed[0]["photo"])


class GroupEventTests(APITestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.outsider = User.objects.create_user(username="ana", password="x")
        befriend(self.joni, self.diego)
        self.group = create_group(owner=self.joni, name="Chilensios", members=[self.diego])
        self.event = create_event(
            creator=self.joni,
            title="Asado chilensio",
            starts_at=timezone.now() + timedelta(days=3),
            location="Parque",
            group=self.group,
        )

    def test_group_events_appear_in_members_feed(self):
        self.client.force_authenticate(self.diego)

        feed = self.client.get(reverse("event-list")).data

        self.assertEqual([e["title"] for e in feed], ["Asado chilensio"])
        self.assertEqual(feed[0]["group"]["name"], "Chilensios")

    def test_group_events_not_in_outsiders_feed(self):
        self.client.force_authenticate(self.outsider)

        self.assertEqual(self.client.get(reverse("event-list")).data, [])

    def test_outsider_can_view_but_not_join(self):
        self.client.force_authenticate(self.outsider)

        detail = self.client.get(reverse("event-detail", args=[self.event.pk]))
        join = self.client.put(reverse("event-attendance", args=[self.event.pk]), {"status": "going"})

        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertFalse(detail.data["can_join"])
        self.assertEqual(join.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(EventParticipant.objects.filter(user=self.outsider).exists())

    def test_outsider_cannot_create_polls_or_vote(self):
        poll = create_poll(event=self.event, created_by=self.joni, question="¿Qué llevamos?", options=["A", "B"])
        self.client.force_authenticate(self.outsider)

        create = self.client.post(
            reverse("event-polls", args=[self.event.pk]), {"question": "¿Y?", "options": ["X", "Y"]}, format="json"
        )
        vote = self.client.put(reverse("poll-vote", args=[poll.id]), {"option": poll.options.first().id})

        self.assertEqual(create.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(vote.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_can_join(self):
        self.client.force_authenticate(self.diego)

        response = self.client.put(reverse("event-attendance", args=[self.event.pk]), {"status": "going"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["can_join"])

    def test_create_only_in_own_groups(self):
        self.client.force_authenticate(self.outsider)
        payload = {
            "title": "Intruso",
            "starts_at": (timezone.now() + timedelta(days=1)).isoformat(),
            "location": "X",
            "group": self.group.id,
        }

        response = self.client.post(reverse("event-list"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("group", response.data)

    def test_group_events_list(self):
        self.client.force_authenticate(self.diego)
        self.assertEqual(len(self.client.get(reverse("event-list"), {"group": self.group.id}).data), 1)

        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.get(reverse("event-list"), {"group": self.group.id}).status_code, 404)
