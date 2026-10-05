from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

PASSWORD = "una-clave-segura-123"


class AuthTests(APITestCase):
    def test_csrf_endpoint_sets_cookie(self):
        response = self.client.get(reverse("auth-csrf"))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertIn("csrftoken", response.cookies)

    def test_register_creates_user_and_logs_in(self):
        response = self.client.post(
            reverse("auth-register"),
            {"username": "diego", "email": "diego@example.com", "password": PASSWORD},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "diego")
        self.assertNotIn("password", response.data)
        self.assertEqual(self.client.get(reverse("users-me")).status_code, status.HTTP_200_OK)

    def test_register_rejects_duplicate_username(self):
        User.objects.create_user(username="diego", password=PASSWORD)

        response = self.client.post(reverse("auth-register"), {"username": "diego", "password": PASSWORD})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_register_rejects_weak_password(self):
        response = self.client.post(reverse("auth-register"), {"username": "diego", "password": "123"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_login_and_logout(self):
        User.objects.create_user(username="diego", password=PASSWORD)

        login = self.client.post(reverse("auth-login"), {"username": "diego", "password": PASSWORD})
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        logout = self.client.post(reverse("auth-logout"))
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(reverse("users-me")).status_code, status.HTTP_403_FORBIDDEN)

    def test_login_with_wrong_password_fails(self):
        User.objects.create_user(username="diego", password=PASSWORD)

        response = self.client.post(reverse("auth-login"), {"username": "diego", "password": "mala"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="diego", password=PASSWORD)
        self.client.force_authenticate(self.user)

    def test_update_username(self):
        response = self.client.patch(reverse("users-me"), {"username": "diego_g"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "diego_g")

    def test_default_appearance(self):
        response = self.client.get(reverse("users-me"))

        self.assertEqual(response.data["theme_color"], "#b9a6f2")
        self.assertEqual(response.data["theme_mode"], "system")
        self.assertTrue(response.data["show_decor"])

    def test_update_appearance(self):
        response = self.client.patch(
            reverse("users-me"),
            {"theme_color": "#A8E6CF", "theme_mode": "dark", "show_decor": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["theme_color"], "#a8e6cf")
        self.assertEqual(response.data["theme_mode"], "dark")
        self.assertFalse(response.data["show_decor"])

    def test_rejects_invalid_appearance(self):
        for data in ({"theme_color": "rojo"}, {"theme_color": "#12345"}, {"theme_mode": "sepia"}):
            response = self.client.patch(reverse("users-me"), data, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, data)
