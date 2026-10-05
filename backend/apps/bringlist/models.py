from django.conf import settings
from django.db import models

from apps.events.models import Event


class BringItem(models.Model):
    """Algo que hay que llevar a la junta (carbón, hielo...) y quién se encarga."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="bring_items")
    name = models.CharField(max_length=80)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    # Quien dijo "yo lo llevo" (vacío = nadie todavía).
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.name
