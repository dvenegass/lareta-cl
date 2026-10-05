from django.conf import settings
from django.db import models

from apps.events.models import Event


class Expense(models.Model):
    """Un gasto de una junta con gastos compartidos: "Pizza $20.000, pagó Diego"."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="expenses")
    description = models.CharField(max_length=120)
    amount = models.PositiveIntegerField()  # pesos, sin decimales
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expenses_paid")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.description} (${self.amount})"
