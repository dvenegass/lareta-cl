from django.conf import settings
from django.db import models

from apps.events.models import Event


class EventPhoto(models.Model):
    """Una foto del álbum de una junta ("las fotos del asado")."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="photos")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_photos"
    )
    # Se guardan las dimensiones para armar la grilla sin esperar a que carguen.
    image = models.ImageField(upload_to="photos/%Y/%m/", width_field="width", height_field="height")
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Foto de {self.uploaded_by} en {self.event}"
