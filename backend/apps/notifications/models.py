from django.conf import settings
from django.db import models
from django.db.models import Q


class Notification(models.Model):
    """
    Un aviso para un usuario. Guarda el tipo y a qué se refiere (persona, junta,
    grupo); el texto se arma al mostrarlo (ver messages.py), así siempre usa
    los nombres actuales.
    """

    class Kind(models.TextChoices):
        FRIEND_REQUEST = "friend_request", "Solicitud de amistad"
        FRIEND_ACCEPTED = "friend_accepted", "Solicitud aceptada"
        GROUP_ADDED = "group_added", "Te agregaron a un grupo"
        GROUP_EVENT = "group_event", "Junta nueva en un grupo"
        EVENT_CHANGED = "event_changed", "Cambió una junta"
        EVENT_REMINDER = "event_reminder", "Recordatorio de junta"
        EVENT_CANCELLED = "event_cancelled", "Se canceló una junta"
        EVENT_REACTIVATED = "event_reactivated", "Se reactivó una junta"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    kind = models.CharField(max_length=20, choices=Kind.choices)
    # Quién hizo la acción (vacío en los recordatorios).
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    # Referencias como texto ("app.Modelo") para no importar otras apps aquí.
    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, null=True, blank=True, related_name="+")
    group = models.ForeignKey("groups.Group", on_delete=models.CASCADE, null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "read_at"])]
        constraints = [
            # Un solo recordatorio por persona y junta.
            models.UniqueConstraint(
                fields=["recipient", "event"],
                condition=Q(kind="event_reminder"),
                name="one_reminder_per_event",
            ),
        ]

    def __str__(self):
        return f"{self.get_kind_display()} → {self.recipient}"
