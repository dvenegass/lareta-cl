import re

from django.core import mail
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

OLD_PASSWORD = "una-clave-segura-123"
NEW_PASSWORD = "otra-clave-nueva-456"


class PasswordResetTests(APITestCase):
    def setUp(self):
        cache.clear()  # el límite de peticiones se guarda en la caché
        self.user = User.objects.create_user(username="diego", email="diego@example.com", password=OLD_PASSWORD)

    def request_reset(self, email="diego@example.com"):
        return self.client.post(reverse("auth-password-reset"), {"email": email})

    def link_parts(self):
        """Saca uid y token del enlace del último email enviado."""
        match = re.search(r"/reset-password/([^/\s]+)/([^/\s]+)", mail.outbox[-1].body)
        return match.group(1), match.group(2)

    def confirm(self, uid, token, password=NEW_PASSWORD):
        return self.client.post(
            reverse("auth-password-reset-confirm"),
            {"uid": uid, "token": token, "new_password": password},
        )

    def test_sends_email_with_link(self):
        response = self.request_reset(email="DIEGO@example.com")  # sin importar mayúsculas

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["diego@example.com"])
        self.assertIn("http://localhost:5173/reset-password/", mail.outbox[0].body)

    def test_unknown_email_gets_same_response_and_no_email(self):
        response = self.request_reset(email="nadie@example.com")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_changes_password_and_logs_in(self):
        self.request_reset()
        uid, token = self.link_parts()

        response = self.confirm(uid, token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "diego")
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW_PASSWORD))
        self.assertEqual(self.client.get(reverse("users-me")).status_code, status.HTTP_200_OK)

    def test_link_works_only_once(self):
        self.request_reset()
        uid, token = self.link_parts()
        self.confirm(uid, token)

        response = self.confirm(uid, token, password="tercera-clave-789")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_link(self):
        response = self.confirm("bmFkYQ", "token-falso")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_rejects_weak_password(self):
        self.request_reset()
        uid, token = self.link_parts()

        response = self.confirm(uid, token, password="123")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", response.data)

    def test_rate_limited(self):
        for _ in range(5):
            self.request_reset()

        self.assertEqual(self.request_reset().status_code, status.HTTP_429_TOO_MANY_REQUESTS)
