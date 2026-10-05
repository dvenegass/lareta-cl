from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.models import EventParticipant
from apps.events.services import create_event, set_attendance
from apps.notifications.models import Notification
from apps.notifications.services import create_due_reminders
from apps.stats.selectors import compute_stats
from apps.users.models import User


class CancelEventTests(APITestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.diego = User.objects.create_user(username="diego", password="x")
        self.event = create_event(
            creator=self.joni, title="Asado", starts_at=timezone.now() + timedelta(hours=5), location="Casa"
        )
        set_attendance(event=self.event, user=self.diego, status=EventParticipant.Status.GOING)
        self.cancel_url = reverse("event-cancel", args=[self.event.pk])

    def test_organizer_cancels_with_reason_and_going_people_are_notified(self):
        self.client.force_authenticate(self.joni)

        response = self.client.post(self.cancel_url, {"reason": "Se largó a llover"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_cancelled"])
        self.assertEqual(response.data["cancel_reason"], "Se largó a llover")
        self.assertFalse(response.data["can_join"])
        self.assertTrue(
            Notification.objects.filter(recipient=self.diego, kind=Notification.Kind.EVENT_CANCELLED).exists()
        )
        # Quien cancela no se avisa a sí mismo.
        self.assertFalse(Notification.objects.filter(recipient=self.joni).exists())

    def test_only_the_organizer_can_cancel(self):
        self.client.force_authenticate(self.diego)

        self.assertEqual(self.client.post(self.cancel_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_cancelled_event_blocks_attendance(self):
        self.client.force_authenticate(self.joni)
        self.client.post(self.cancel_url)

        self.client.force_authenticate(self.diego)
        response = self.client.put(reverse("event-attendance", args=[self.event.pk]), {"status": "not_going"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "Esta junta fue cancelada.")

    def test_reactivate(self):
        self.client.force_authenticate(self.joni)
        self.client.post(self.cancel_url, {"reason": "Lluvia"})

        response = self.client.delete(self.cancel_url)

        self.assertFalse(response.data["is_cancelled"])
        self.assertEqual(response.data["cancel_reason"], "")
        self.assertTrue(
            Notification.objects.filter(recipient=self.diego, kind=Notification.Kind.EVENT_REACTIVATED).exists()
        )

    def test_cancelled_events_stay_in_feed_marked(self):
        self.client.force_authenticate(self.joni)
        self.client.post(self.cancel_url)

        self.client.force_authenticate(self.diego)
        feed = self.client.get(reverse("event-list")).data

        self.assertEqual(len(feed), 1)
        self.assertTrue(feed[0]["is_cancelled"])

    def test_no_reminders_or_points_for_cancelled_events(self):
        self.event.starts_at = timezone.now() - timedelta(hours=1)
        self.event.save()
        self.client.force_authenticate(self.joni)
        self.client.post(self.cancel_url)

        self.assertEqual(compute_stats([self.joni.id])[self.joni.id]["events_organized"], 0)
        self.assertEqual(compute_stats([self.diego.id])[self.diego.id]["confirmations"], 0)

        upcoming = create_event(
            creator=self.joni, title="Otra", starts_at=timezone.now() + timedelta(hours=3), location="Plaza"
        )
        set_attendance(event=upcoming, user=self.diego, status=EventParticipant.Status.GOING)
        self.client.post(reverse("event-cancel", args=[upcoming.pk]))
        create_due_reminders(user=self.diego)

        self.assertFalse(
            Notification.objects.filter(recipient=self.diego, kind=Notification.Kind.EVENT_REMINDER).exists()
        )


class HistoryTests(APITestCase):
    def setUp(self):
        self.joni = User.objects.create_user(username="joni", password="x")
        self.client.force_authenticate(self.joni)

    def _event(self, title, days):
        return create_event(
            creator=self.joni, title=title, starts_at=timezone.now() + timedelta(days=days), location="Casa"
        )

    def test_past_scope_lists_past_events_newest_first_without_cancelled(self):
        self._event("Hace un mes", -30)
        self._event("Ayer", -1)
        self._event("Mañana", 1)
        cancelled = self._event("Cancelada", -3)
        cancelled.cancelled_at = timezone.now()
        cancelled.save()

        response = self.client.get(reverse("event-list"), {"scope": "past"})

        self.assertEqual([e["title"] for e in response.data], ["Ayer", "Hace un mes"])
        self.assertEqual(response.data[0]["photo_count"], 0)
        self.assertIsNone(response.data[0]["cover_image"])
