from django.conf import settings
from django.db import models
from django.db.models import F, Q


class Friendship(models.Model):
    """
    Una solicitud de amistad. Mientras está "pending" es una solicitud;
    al aceptarse pasa a "accepted" y ambos son amigos (la relación es mutua).
    Rechazar, cancelar o eliminar a un amigo borra la fila.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        ACCEPTED = "accepted", "Aceptada"

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="friend_requests_sent"
    )
    addressee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="friend_requests_received"
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["requester", "addressee"], name="unique_friendship"),
            models.CheckConstraint(condition=~Q(requester=F("addressee")), name="no_self_friendship"),
        ]

    def __str__(self):
        return f"{self.requester} → {self.addressee} ({self.status})"
