from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.models import Event, EventParticipant
from apps.events.services import create_event, update_event
from apps.friends.models import Friendship
from apps.friends.services import accept_friend_request, send_friend_request
from apps.groups.services import add_member, create_group
from apps.notifications.models import Notification
from apps.users.models import User

Kind = Notification.Kind


def kinds_for(user):
    return list(Notification.objects.filter(recipient=user).values_list("kind", flat=True))


class NotificationTriggersTests(APITestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")

    def test_friend_request_and_acceptance(self):
        friendship = send_friend_request(requester=self.joni, addressee=self.diego)
        self.assertEqual(kinds_for(self.diego), [Kind.FRIEND_REQUEST])

        accept_friend_request(friendship=friendship)
        self.assertEqual(kinds_for(self.joni), [Kind.FRIEND_ACCEPTED])

    def test_added_to_group(self):
        group = create_group(owner=self.joni, name="Chilensios", members=[self.diego])

        self.assertEqual(kinds_for(self.diego), [Kind.GROUP_ADDED])
        self.assertEqual(kinds_for(self.joni), [])  # quien agrega no se avisa a sí mismo

        add_member(group=group, user=self.diego, added_by=self.joni)  # ya estaba: no repite
        self.assertEqual(kinds_for(self.diego), [Kind.GROUP_ADDED])

    def test_new_event_in_group_notifies_other_members(self):
        group = create_group(owner=self.joni, name="Chilensios", members=[self.diego])
        Notification.objects.all().delete()

        create_event(
            creator=self.joni,
            title="PICHANGA",
            starts_at=timezone.now() + timedelta(days=5),
            location="Cancha",
            group=group,
        )

        self.assertEqual(kinds_for(self.diego), [Kind.GROUP_EVENT])
        self.assertEqual(kinds_for(self.joni), [])
        self.assertEqual(kinds_for(self.ana), [])

    def test_changing_date_notifies_people_going(self):
        event = create_event(
            creator=self.joni, title="Asado", starts_at=timezone.now() + timedelta(days=5), location="Parque"
        )
        EventParticipant.objects.create(event=event, user=self.diego, status="going")
        EventParticipant.objects.create(event=event, user=self.ana, status="not_going")

        update_event(event=event, description="Traigan carbón")  # sin cambios importantes
        self.assertEqual(kinds_for(self.diego), [])

        update_event(event=event, location="Casa de Joni")
        self.assertEqual(kinds_for(self.diego), [Kind.EVENT_CHANGED])
        self.assertEqual(kinds_for(self.ana), [])  # dijo que no iba


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.client.force_authenticate(self.diego)

    def test_list_texts_targets_and_read(self):
        send_friend_request(requester=self.joni, addressee=self.diego)

        response = self.client.get(reverse("notification-list"))

        self.assertEqual(response.data["unread_count"], 1)
        item = response.data["results"][0]
        self.assertEqual(item["text"], "joni te envió una solicitud de amistad")
        self.assertEqual(item["target"], {"type": "friends"})
        self.assertFalse(item["is_read"])

        self.client.post(reverse("notification-read", args=[item["id"]]))
        self.assertEqual(self.client.get(reverse("notification-unread-count")).data["unread_count"], 0)

    def test_read_all(self):
        send_friend_request(requester=self.joni, addressee=self.diego)
        Friendship.objects.all().delete()
        send_friend_request(requester=self.joni, addressee=self.diego)

        self.client.post(reverse("notification-read-all"))

        self.assertEqual(self.client.get(reverse("notification-unread-count")).data["unread_count"], 0)

    def test_cannot_read_others_notifications(self):
        send_friend_request(requester=self.diego, addressee=self.joni)
        others = Notification.objects.get(recipient=self.joni)

        response = self.client.post(reverse("notification-read", args=[others.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reminder_for_events_in_next_24h_only_once(self):
        soon = create_event(
            creator=self.joni, title="PICHANGA", starts_at=timezone.now() + timedelta(days=2), location="Cancha"
        )
        Event.objects.filter(pk=soon.pk).update(starts_at=timezone.now() + timedelta(hours=3))
        later = create_event(
            creator=self.joni, title="Asado", starts_at=timezone.now() + timedelta(days=3), location="Parque"
        )
        EventParticipant.objects.create(event=soon, user=self.diego, status="going")
        EventParticipant.objects.create(event=later, user=self.diego, status="going")

        first = self.client.get(reverse("notification-list")).data
        second = self.client.get(reverse("notification-list")).data

        reminders = [n for n in second["results"] if n["kind"] == Kind.EVENT_REMINDER]
        self.assertEqual(len(reminders), 1)
        self.assertTrue(reminders[0]["text"].startswith("«PICHANGA» es "))
        self.assertEqual(first["unread_count"], second["unread_count"])
