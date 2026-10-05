"""Operaciones de escritura sobre juntas (lógica de negocio, sin HTTP)."""

from django.db import transaction
from django.utils import timezone

from apps.groups.selectors import is_member
from apps.notifications.models import Notification
from apps.notifications.services import notify
from apps.users.models import User

from .models import Event, EventParticipant


@transaction.atomic
def create_event(
    *,
    creator,
    title,
    starts_at,
    location,
    description="",
    group=None,
    money_mode=Event.MoneyMode.NONE,
    fee_amount=None,
    bring_list_enabled=True,
    polls_enabled=True,
    comments_enabled=True,
) -> Event:
    event = Event.objects.create(
        creator=creator,
        title=title,
        description=description,
        starts_at=starts_at,
        location=location,
        group=group,
        money_mode=money_mode,
        fee_amount=fee_amount,
        bring_list_enabled=bring_list_enabled,
        polls_enabled=polls_enabled,
        comments_enabled=comments_enabled,
    )
    # Quien crea la junta asiste por defecto.
    EventParticipant.objects.create(
        event=event,
        user=creator,
        status=EventParticipant.Status.GOING,
    )

    # Avisar a los demás miembros del grupo.
    if group is not None:
        members = User.objects.filter(group_memberships__group=group)
        notify(recipients=members, kind=Notification.Kind.GROUP_EVENT, actor=creator, event=event)
    return event


# Cambios que se avisan a quienes van a la junta.
NOTIFIED_FIELDS = ("starts_at", "location")


def update_event(*, event: Event, **data) -> Event:
    changed = any(field in data and data[field] != getattr(event, field) for field in NOTIFIED_FIELDS)

    for field, value in data.items():
        setattr(event, field, value)
    event.save()

    if changed:
        notify(recipients=_going_users(event), kind=Notification.Kind.EVENT_CHANGED, actor=event.creator, event=event)
    return event


def delete_event(*, event: Event) -> None:
    event.delete()


def _going_users(event: Event):
    return User.objects.filter(participations__event=event, participations__status=EventParticipant.Status.GOING)


def cancel_event(*, event: Event, reason: str = "") -> Event:
    """Marca la junta como cancelada y avisa a quienes iban a ir."""
    if event.is_cancelled:
        return event
    event.cancelled_at = timezone.now()
    event.cancel_reason = reason
    event.save(update_fields=["cancelled_at", "cancel_reason", "updated_at"])
    notify(recipients=_going_users(event), kind=Notification.Kind.EVENT_CANCELLED, actor=event.creator, event=event)
    return event


def reactivate_event(*, event: Event) -> Event:
    """Deshace la cancelación (las respuestas de cada uno se mantienen)."""
    if not event.is_cancelled:
        return event
    event.cancelled_at = None
    event.cancel_reason = ""
    event.save(update_fields=["cancelled_at", "cancel_reason", "updated_at"])
    notify(recipients=_going_users(event), kind=Notification.Kind.EVENT_REACTIVATED, actor=event.creator, event=event)
    return event


def can_respond(*, event: Event, user) -> bool:
    """
    Cualquiera con el enlace puede ver una junta, pero si es de un grupo solo
    sus miembros (y quien la creó) pueden unirse. En una junta cancelada ya
    nadie puede confirmar ni participar (votar, anotar cosas, comentar…).
    """
    if event.is_cancelled:
        return False
    if event.group_id is None or event.creator_id == user.id:
        return True
    return is_member(user, event.group_id)


def respond_denied_message(event: Event) -> str:
    """Por qué `can_respond` dio False, en palabras para mostrar."""
    if event.is_cancelled:
        return "Esta junta fue cancelada."
    return f"Solo los miembros de «{event.group.name}» pueden participar en esta junta."


def set_attendance(*, event: Event, user, status: str) -> EventParticipant:
    """Crea o cambia la respuesta del usuario. Repetir la llamada no duplica nada."""
    participant = EventParticipant.objects.filter(event=event, user=user).first()
    if participant is None:
        return EventParticipant.objects.create(event=event, user=user, status=status)

    # Confirmar y luego bajarse cuenta como cancelación (ranking "El que más cancela").
    if participant.status == EventParticipant.Status.GOING and status == EventParticipant.Status.NOT_GOING:
        participant.has_cancelled = True
    participant.status = status
    participant.save()
    return participant


def update_participant(*, participant: EventParticipant, **data) -> EventParticipant:
    """Cambios que hace el organizador: llegada (`arrival`) y cuota pagada (`fee_paid`)."""
    for field, value in data.items():
        setattr(participant, field, value)
    participant.save()
    return participant
