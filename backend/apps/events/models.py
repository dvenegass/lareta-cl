import uuid

from django.conf import settings
from django.db import models


class Event(models.Model):
    """Una junta. Se identifica con un UUID para poder compartirla por enlace."""

    class MoneyMode(models.TextChoices):
        NONE = "none", "Sin dinero"
        FIXED = "fixed", "Cuota fija"
        SHARED = "shared", "Gastos compartidos"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    starts_at = models.DateTimeField()
    location = models.CharField(max_length=200)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_events",
    )
    # Opcional: si es de un grupo, sale en el feed de sus miembros y solo ellos pueden unirse.
    # Si el grupo se borra, la junta queda como "solo por enlace".
    group = models.ForeignKey(
        "groups.Group", on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )
    # Cómo se maneja el dinero. Con cuota fija, `fee_amount` es lo que pone cada uno
    # (en pesos, sin decimales). Los gastos compartidos viven en la app `expenses`.
    money_mode = models.CharField(max_length=10, choices=MoneyMode.choices, default=MoneyMode.NONE)
    fee_amount = models.PositiveIntegerField(null=True, blank=True)
    # Secciones opcionales de la junta (el organizador las activa o desactiva).
    # Desactivar una no borra sus datos: solo la oculta y bloquea cambios.
    bring_list_enabled = models.BooleanField("Qué llevar", default=True)
    polls_enabled = models.BooleanField("Votaciones", default=True)
    comments_enabled = models.BooleanField("Comentarios", default=True)
    # Cancelada por el organizador: sigue visible (con el motivo) pero ya no se puede
    # confirmar ni participar, y no cuenta para puntos ni recordatorios.
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancel_reason = models.CharField("Motivo de la cancelación", max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at"]

    def __str__(self):
        return self.title

    @property
    def is_cancelled(self) -> bool:
        return self.cancelled_at is not None


class EventParticipant(models.Model):
    """La respuesta de un usuario a una junta (asistirá / no asistirá)."""

    class Status(models.TextChoices):
        GOING = "going", "Asistiré"
        NOT_GOING = "not_going", "No asistiré"

    class Arrival(models.TextChoices):
        ON_TIME = "on_time", "Llegó a tiempo"
        LATE = "late", "Llegó tarde"
        ABSENT = "absent", "No llegó"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="participations",
    )
    status = models.CharField(max_length=20, choices=Status.choices)
    # Lo marca el organizador una vez empezada la junta. Vacío = sin marcar.
    arrival = models.CharField(max_length=10, choices=Arrival.choices, null=True, blank=True)
    # True si alguna vez confirmó y luego dijo que no iría.
    has_cancelled = models.BooleanField(default=False)
    # Solo para juntas con cuota fija: el organizador marca quién ya pagó.
    fee_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["event", "user"], name="unique_event_participant"),
        ]

    def __str__(self):
        return f"{self.user} → {self.event} ({self.status})"

    @property
    def attended(self) -> bool:
        return self.arrival in (self.Arrival.ON_TIME, self.Arrival.LATE)
