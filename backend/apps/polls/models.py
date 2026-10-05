from django.conf import settings
from django.db import models

from apps.events.models import Event


class Poll(models.Model):
    """Una votación dentro de una junta, p. ej. "¿Dónde hacemos la junta?"."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="polls")
    question = models.CharField(max_length=200)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="polls")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.question


class PollOption(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=100)
    position = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return self.text


class PollVote(models.Model):
    """Un voto por persona y votación (se puede cambiar de opción)."""

    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="votes")
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="poll_votes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["poll", "user"], name="one_vote_per_poll"),
        ]
