from datetime import timedelta

from django.test import SimpleTestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.events.models import Event, EventParticipant
from apps.events.services import create_event
from apps.expenses.models import Expense
from apps.friends.models import Friendship
from apps.groups.models import GroupMembership
from apps.groups.services import create_group
from apps.polls.services import create_poll
from apps.stats.rules import level_for
from apps.stats.selectors import compute_stats, friends_circle_ids
from apps.users.models import User


def past_event(creator, location="Casa de Diego", **extra):
    event = create_event(
        creator=creator,
        title="Junta",
        starts_at=timezone.now() + timedelta(days=1),
        location=location,
        **extra,
    )
    Event.objects.filter(pk=event.pk).update(starts_at=timezone.now() - timedelta(days=1))
    return event


class LevelTests(SimpleTestCase):
    def test_levels(self):
        self.assertEqual(level_for(0)[0].number, 1)
        self.assertEqual(level_for(30)[0].number, 2)
        self.assertEqual(level_for(79)[1].min_points, 80)
        self.assertIsNone(level_for(10_000)[1])


class StatsTests(APITestCase):
    def setUp(self):
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.beto = User.objects.create_user(username="beto", password="x")

    def test_points(self):
        event = past_event(self.diego)
        EventParticipant.objects.filter(event=event, user=self.diego).update(arrival="on_time")
        EventParticipant.objects.create(event=event, user=self.ana, status="going", arrival="late")
        create_poll(event=event, created_by=self.ana, question="¿Qué?", options=["A", "B"])

        stats = compute_stats([self.diego.id, self.ana.id])

        # Diego: organizó (10) + asistió (5) + confirmó (2) + a tiempo (5)
        self.assertEqual(stats[self.diego.id]["points"], 22)
        # Ana: asistió (5) + confirmó (2) + encuesta (3); llegó tarde → sin bonus
        self.assertEqual(stats[self.ana.id]["points"], 10)
        self.assertEqual(stats[self.ana.id]["late"], 1)

    def test_empty_event_does_not_count_as_organized(self):
        past_event(self.diego)  # nadie más confirmó

        self.assertEqual(compute_stats([self.diego.id])[self.diego.id]["events_organized"], 0)

    def test_places_and_spent(self):
        first = past_event(self.diego, location="Casa de Diego", money_mode="fixed", fee_amount=3000)
        second = past_event(self.diego, location="  casa de diego ", money_mode="shared")
        third = past_event(self.diego, location="Bowling")
        EventParticipant.objects.filter(user=self.diego).update(arrival="on_time")
        EventParticipant.objects.filter(event=first, user=self.diego).update(fee_paid=True)
        Expense.objects.create(event=second, paid_by=self.diego, created_by=self.diego, description="X", amount=7000)
        self.assertIsNotNone(third)

        stats = compute_stats([self.diego.id])[self.diego.id]

        self.assertEqual(stats["places"], 2)  # "Casa de Diego" cuenta una vez
        self.assertEqual(stats["spent"], 10000)

    def test_friends_circle(self):
        Friendship.objects.create(requester=self.diego, addressee=self.ana, status="accepted")
        Friendship.objects.create(requester=self.diego, addressee=self.beto)  # pendiente: no cuenta

        self.assertEqual(friends_circle_ids(self.diego), sorted([self.diego.id, self.ana.id]))

    def test_rankings_between_friends(self):
        Friendship.objects.create(requester=self.diego, addressee=self.ana, status="accepted")
        event = past_event(self.diego)
        EventParticipant.objects.create(event=event, user=self.ana, status="going", arrival="late")
        EventParticipant.objects.create(event=event, user=self.beto, status="going", arrival="late")
        self.client.force_authenticate(self.diego)

        response = self.client.get(reverse("stats-rankings"))

        self.assertIsNone(response.data["group"])
        self.assertEqual(response.data["people_count"], 2)
        late = next(r for r in response.data["rankings"] if r["key"] == "late")
        self.assertEqual([e["user"]["username"] for e in late["entries"]], ["ana"])  # beto no es amigo
        punctual = next(r for r in response.data["rankings"] if r["key"] == "punctual")
        self.assertEqual(punctual["entries"], [])

    def test_rankings_by_group(self):
        group = create_group(owner=self.diego, name="Chilensios")
        GroupMembership.objects.create(group=group, user=self.beto)
        self.client.force_authenticate(self.diego)

        response = self.client.get(reverse("stats-rankings"), {"group": group.id})

        self.assertEqual(response.data["group"]["name"], "Chilensios")
        self.assertEqual(response.data["people_count"], 2)

        self.client.force_authenticate(self.ana)  # no es miembro
        self.assertEqual(self.client.get(reverse("stats-rankings"), {"group": group.id}).status_code, 404)

    def test_my_stats_endpoint(self):
        self.client.force_authenticate(self.diego)

        response = self.client.get(reverse("stats-me"))

        self.assertEqual(response.data["points"], 0)
        self.assertEqual(response.data["level"]["name"], "Recién llegado")
        self.assertEqual(response.data["next_level"]["min_points"], 30)
