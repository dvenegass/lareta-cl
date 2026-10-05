"""Texto y destino de cada notificación (lo que se muestra y adónde lleva al tocarla)."""

from django.utils import timezone

from .models import Notification

Kind = Notification.Kind


def _when(starts_at) -> str:
    """"hoy a las 20:00", "mañana a las 20:00" o "el 14/10 a las 20:00"."""
    local = timezone.localtime(starts_at)
    days = (local.date() - timezone.localdate()).days
    time = local.strftime("%H:%M")
    if days == 0:
        return f"hoy a las {time}"
    if days == 1:
        return f"mañana a las {time}"
    return f"el {local.strftime('%d/%m')} a las {time}"


def notification_text(notification: Notification) -> str:
    actor = notification.actor.username if notification.actor else "Alguien"
    event = notification.event
    group = notification.group

    match notification.kind:
        case Kind.FRIEND_REQUEST:
            return f"{actor} te envió una solicitud de amistad"
        case Kind.FRIEND_ACCEPTED:
            return f"{actor} aceptó tu solicitud de amistad"
        case Kind.GROUP_ADDED:
            return f"{actor} te agregó al grupo {group.name}" if group else f"{actor} te agregó a un grupo"
        case Kind.GROUP_EVENT:
            where = f" en {event.group.name}" if event and event.group else ""
            return f"{actor} creó «{event.title}»{where}" if event else f"{actor} creó una junta"
        case Kind.EVENT_CHANGED:
            return f"{actor} cambió la fecha o el lugar de «{event.title}»" if event else f"{actor} cambió una junta"
        case Kind.EVENT_REMINDER:
            return f"«{event.title}» es {_when(event.starts_at)}" if event else "Tienes una junta pronto"
        case Kind.EVENT_CANCELLED:
            return f"{actor} canceló «{event.title}»" if event else f"{actor} canceló una junta"
        case Kind.EVENT_REACTIVATED:
            return f"«{event.title}» vuelve: {actor} la reactivó" if event else f"{actor} reactivó una junta"
    return "Tienes una notificación nueva"


def notification_target(notification: Notification) -> dict | None:
    """Adónde lleva la notificación: {"type": "event" | "group" | "user" | "friends", ...}."""
    if notification.kind == Kind.FRIEND_REQUEST:
        return {"type": "friends"}
    if notification.kind == Kind.FRIEND_ACCEPTED and notification.actor:
        return {"type": "user", "username": notification.actor.username}
    if notification.kind == Kind.GROUP_ADDED and notification.group:
        return {"type": "group", "id": notification.group_id}
    if notification.event:
        return {"type": "event", "id": str(notification.event_id)}
    return None
