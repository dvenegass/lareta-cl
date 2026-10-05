"""
Crear y marcar notificaciones. Las demás apps llaman a `notify` desde sus
servicios cuando pasa algo que alguien debería saber.
"""

from datetime import timedelta

from django.utils import timezone

from .models import Notification

# Se avisa de las juntas a las que vas que empiezan dentro de este plazo.
REMINDER_WINDOW = timedelta(hours=24)


def notify(*, recipients, kind: str, actor=None, event=None, group=None) -> None:
    """Crea una notificación para cada destinatario (nunca para quien hizo la acción)."""
    actor_id = actor.id if actor else None
    Notification.objects.bulk_create(
        Notification(recipient=user, kind=kind, actor=actor, event=event, group=group)
        for user in recipients
        if user.id != actor_id
    )


def mark_read(*, notification: Notification) -> None:
    if notification.read_at is None:
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at"])


def mark_all_read(*, user) -> None:
    Notification.objects.filter(recipient=user, read_at__isnull=True).update(read_at=timezone.now())


def create_due_reminders(*, user) -> None:
    """
    Crea los recordatorios de las juntas a las que el usuario va y que empiezan
    en las próximas 24 h. Se llama al revisar las notificaciones: así no hace
    falta un proceso en segundo plano, y la restricción única evita duplicados.
    """
    from apps.events.models import Event, EventParticipant  # evita importación circular

    now = timezone.now()
    already_reminded = Notification.objects.filter(
        recipient=user, kind=Notification.Kind.EVENT_REMINDER
    ).values("event_id")
    going = EventParticipant.objects.filter(user=user, status=EventParticipant.Status.GOING).values("event_id")
    due = Event.objects.filter(
        pk__in=going,
        starts_at__gt=now,
        starts_at__lte=now + REMINDER_WINDOW,
        cancelled_at__isnull=True,  # de una junta cancelada no se recuerda nada
    ).exclude(pk__in=already_reminded)

    Notification.objects.bulk_create(
        [Notification(recipient=user, kind=Notification.Kind.EVENT_REMINDER, event=event) for event in due],
        ignore_conflicts=True,
    )
