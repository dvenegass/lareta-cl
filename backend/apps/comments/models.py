from django.conf import settings
from django.db import models

from apps.events.models import Event


class Comment(models.Model):
    """Un mensaje en el hilo de una junta ("voy atrasado", "¿alguien me lleva?")."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    body = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author}: {self.body[:40]}"
