from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.events.models import EventParticipant
from apps.events.services import create_event
from apps.users.models import User


class ExpenseApiTests(APITestCase):
    def setUp(self):
        self.diego = User.objects.create_user(username="diego", password="x")
        self.ana = User.objects.create_user(username="ana", password="x")
        self.event = create_event(
            creator=self.diego,
            title="Asado",
            starts_at=timezone.now() + timedelta(days=2),
            location="Parque",
            money_mode="shared",
        )
        EventParticipant.objects.create(event=self.event, user=self.ana, status="going")
        self.url = reverse("event-expenses", args=[self.event.pk])
        self.client.force_authenticate(self.diego)

    def test_add_expense_and_get_summary(self):
        response = self.client.post(self.url, {"description": "Carne", "amount": 20000}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["total"], 20000)
        self.assertEqual(response.data["per_person"], 10000)
        settlement = response.data["settlements"][0]
        self.assertEqual(
            (settlement["from_user"]["username"], settlement["to_user"]["username"], settlement["amount"]),
            ("ana", "diego", 10000),
        )

    def test_payer_must_be_participant(self):
        stranger = User.objects.create_user(username="beto", password="x")

        response = self.client.post(
            self.url, {"description": "Bebidas", "amount": 5000, "paid_by": stranger.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_for_shared_mode(self):
        self.event.money_mode = "none"
        self.event.save()

        response = self.client.post(self.url, {"description": "Carne", "amount": 100}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_expense(self):
        expense_id = (
            self.client.post(self.url, {"description": "Carne", "amount": 100}, format="json")
            .data["expenses"][0]["id"]
        )
        stranger = User.objects.create_user(username="beto", password="x")

        self.client.force_authenticate(stranger)
        self.assertEqual(self.client.delete(reverse("expense-detail", args=[expense_id])).status_code, 403)

        self.client.force_authenticate(self.diego)
        response = self.client.delete(reverse("expense-detail", args=[expense_id]))
        self.assertEqual(response.data["total"], 0)
