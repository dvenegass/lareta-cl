from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.models import Event, EventParticipant
from apps.events.services import create_event
from apps.users.models import User


def make_event(creator, days_from_now=7, **extra):
    data = {
        "title": "Junta de fin de mes",
        "starts_at": timezone.now() + timedelta(days=days_from_now),
        "location": "Casa de Diego",
        **extra,
    }
    return create_event(creator=creator, **data)


class EventApiTestCase(APITestCase):
    def setUp(self):
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.client.force_authenticate(self.diego)

    def detail_url(self, event):
        return reverse("event-detail", args=[event.pk])

    def attendance_url(self, event):
        return reverse("event-attendance", args=[event.pk])


class CreateEventTests(EventApiTestCase):
    def test_create_event_adds_creator_as_going(self):
        response = self.client.post(
            reverse("event-list"),
            {
                "title": "Junta de fin de mes",
                "starts_at": (timezone.now() + timedelta(days=3)).isoformat(),
                "location": "Casa de Diego",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["creator"]["username"], "diego")
        self.assertEqual(response.data["going_count"], 1)
        self.assertEqual(response.data["my_status"], "going")
        self.assertTrue(response.data["is_creator"])

    def test_cannot_create_event_in_the_past(self):
        response = self.client.post(
            reverse("event-list"),
            {
                "title": "Ayer",
                "starts_at": (timezone.now() - timedelta(days=1)).isoformat(),
                "location": "Plaza",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("starts_at", response.data)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get(reverse("event-list"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MoneyModeTests(EventApiTestCase):
    def payload(self, **extra):
        return {
            "title": "Asado",
            "starts_at": (timezone.now() + timedelta(days=3)).isoformat(),
            "location": "Parque",
            **extra,
        }

    def test_fixed_fee_requires_amount(self):
        response = self.client.post(reverse("event-list"), self.payload(money_mode="fixed"), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("fee_amount", response.data)

    def test_create_with_fixed_fee(self):
        response = self.client.post(
            reverse("event-list"), self.payload(money_mode="fixed", fee_amount=5000), format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["money_mode"], "fixed")
        self.assertEqual(response.data["fee_amount"], 5000)

    def test_fee_is_cleared_when_not_fixed(self):
        event = make_event(self.diego, money_mode="fixed", fee_amount=5000)

        response = self.client.patch(self.detail_url(event), {"money_mode": "shared"}, format="json")

        self.assertEqual(response.data["money_mode"], "shared")
        self.assertIsNone(response.data["fee_amount"])


class EventSectionsTests(EventApiTestCase):
    def payload(self, **extra):
        return {
            "title": "Asado",
            "starts_at": (timezone.now() + timedelta(days=3)).isoformat(),
            "location": "Parque",
            **extra,
        }

    def test_sections_enabled_by_default(self):
        response = self.client.post(reverse("event-list"), self.payload(), format="json")

        self.assertTrue(response.data["bring_list_enabled"])
        self.assertTrue(response.data["polls_enabled"])
        self.assertTrue(response.data["comments_enabled"])

    def test_create_with_bring_items(self):
        response = self.client.post(
            reverse("event-list"),
            self.payload(bring_items=["Carbón", "  Hielo ", "hielo", ""]),
            format="json",
        )

        items = self.client.get(reverse("event-items", args=[response.data["id"]])).data
        self.assertEqual([i["name"] for i in items], ["Carbón", "Hielo"])

    def test_bring_items_ignored_when_list_disabled(self):
        response = self.client.post(
            reverse("event-list"),
            self.payload(bring_list_enabled=False, bring_items=["Carbón"]),
            format="json",
        )

        self.assertFalse(response.data["bring_list_enabled"])
        self.assertEqual(self.client.get(reverse("event-items", args=[response.data["id"]])).data, [])

    def test_disabled_sections_reject_writes(self):
        event = make_event(self.diego, polls_enabled=False, comments_enabled=False, bring_list_enabled=False)

        poll = self.client.post(
            reverse("event-polls", args=[event.pk]), {"question": "¿Y?", "options": ["A", "B"]}, format="json"
        )
        comment = self.client.post(reverse("event-comments", args=[event.pk]), {"body": "Hola"})
        item = self.client.post(reverse("event-items", args=[event.pk]), {"name": "Carbón"})

        self.assertEqual(poll.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(comment.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(item.status_code, status.HTTP_400_BAD_REQUEST)

    def test_organizer_can_turn_sections_off(self):
        event = make_event(self.diego)

        response = self.client.patch(self.detail_url(event), {"comments_enabled": False}, format="json")

        self.assertFalse(response.data["comments_enabled"])
        self.assertTrue(response.data["polls_enabled"])


class ParticipantUpdateTests(EventApiTestCase):
    def participant_url(self, event, user):
        return reverse("event-participant", args=[event.pk, user.pk])

    def started_event(self, **extra):
        event = make_event(self.diego, **extra)
        Event.objects.filter(pk=event.pk).update(starts_at=timezone.now() - timedelta(hours=1))
        EventParticipant.objects.create(event=event, user=self.ana, status="going")
        return event

    def test_organizer_marks_arrival(self):
        event = self.started_event()

        response = self.client.patch(self.participant_url(event, self.ana), {"arrival": "late"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ana = next(p for p in response.data["participants"] if p["user"]["id"] == self.ana.id)
        self.assertEqual(ana["arrival"], "late")

    def test_cannot_mark_arrival_before_start(self):
        event = make_event(self.diego)

        response = self.client.patch(
            self.participant_url(event, self.diego), {"arrival": "on_time"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_organizer_can_mark(self):
        event = self.started_event()
        self.client.force_authenticate(self.ana)

        response = self.client.patch(self.participant_url(event, self.ana), {"arrival": "on_time"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_fee_paid_only_with_fixed_fee(self):
        no_fee = self.started_event()
        with_fee = self.started_event(money_mode="fixed", fee_amount=3000)

        rejected = self.client.patch(self.participant_url(no_fee, self.ana), {"fee_paid": True}, format="json")
        accepted = self.client.patch(self.participant_url(with_fee, self.ana), {"fee_paid": True}, format="json")

        self.assertEqual(rejected.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)


class ListEventTests(EventApiTestCase):
    def test_upcoming_includes_created_and_responded_events_only(self):
        mine = make_event(self.diego)
        responded = make_event(self.ana, title="Asado")
        EventParticipant.objects.create(event=responded, user=self.diego, status="not_going")
        make_event(self.ana, title="Junta ajena")
        past = make_event(self.diego, title="Pasada")
        Event.objects.filter(pk=past.pk).update(starts_at=timezone.now() - timedelta(days=2))

        response = self.client.get(reverse("event-list"))

        ids = [item["id"] for item in response.data]
        self.assertEqual(ids, [str(mine.pk), str(responded.pk)])

    def test_created_scope(self):
        mine = make_event(self.diego)
        make_event(self.ana)

        response = self.client.get(reverse("event-list"), {"scope": "created"})

        self.assertEqual([item["id"] for item in response.data], [str(mine.pk)])

    def test_invalid_scope(self):
        response = self.client.get(reverse("event-list"), {"scope": "otra"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EventDetailTests(EventApiTestCase):
    def test_anyone_with_the_link_can_view(self):
        event = make_event(self.ana)

        response = self.client.get(self.detail_url(event))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_creator"])
        self.assertIsNone(response.data["my_status"])
        self.assertEqual(len(response.data["participants"]), 1)

    def test_creator_can_edit(self):
        event = make_event(self.diego)

        response = self.client.patch(self.detail_url(event), {"location": "Parque"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["location"], "Parque")

    def test_other_users_cannot_edit_or_delete(self):
        event = make_event(self.ana)

        self.assertEqual(
            self.client.patch(self.detail_url(event), {"title": "Hackeada"}).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(self.client.delete(self.detail_url(event)).status_code, status.HTTP_403_FORBIDDEN)

    def test_creator_can_delete(self):
        event = make_event(self.diego)

        response = self.client.delete(self.detail_url(event))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Event.objects.filter(pk=event.pk).exists())


class AttendanceTests(EventApiTestCase):
    def test_confirm_and_change_attendance(self):
        event = make_event(self.ana)

        going = self.client.put(self.attendance_url(event), {"status": "going"})
        self.assertEqual(going.data["my_status"], "going")
        self.assertEqual(going.data["going_count"], 2)

        not_going = self.client.put(self.attendance_url(event), {"status": "not_going"})
        self.assertEqual(not_going.data["my_status"], "not_going")
        self.assertEqual(not_going.data["going_count"], 1)
        self.assertEqual(EventParticipant.objects.filter(event=event, user=self.diego).count(), 1)

    def test_cancelling_after_confirming_is_recorded(self):
        event = make_event(self.ana)
        self.client.put(self.attendance_url(event), {"status": "not_going"})
        participant = EventParticipant.objects.get(event=event, user=self.diego)
        self.assertFalse(participant.has_cancelled)  # nunca confirmó

        self.client.put(self.attendance_url(event), {"status": "going"})
        self.client.put(self.attendance_url(event), {"status": "not_going"})

        participant.refresh_from_db()
        self.assertTrue(participant.has_cancelled)

    def test_invalid_status(self):
        event = make_event(self.ana)

        response = self.client.put(self.attendance_url(event), {"status": "maybe"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
