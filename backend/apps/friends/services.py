"""Operaciones de escritura sobre amistades."""

from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services import notify

from .models import Friendship


def send_friend_request(*, requester, addressee) -> Friendship:
    """Si la otra persona ya me había enviado una solicitud, se aceptan las dos."""
    reverse = Friendship.objects.filter(
        requester=addressee, addressee=requester, status=Friendship.Status.PENDING
    ).first()
    if reverse:
        return accept_friend_request(friendship=reverse)

    friendship = Friendship.objects.create(requester=requester, addressee=addressee)
    notify(recipients=[addressee], kind=Notification.Kind.FRIEND_REQUEST, actor=requester)
    return friendship


def accept_friend_request(*, friendship: Friendship) -> Friendship:
    friendship.status = Friendship.Status.ACCEPTED
    friendship.accepted_at = timezone.now()
    friendship.save(update_fields=["status", "accepted_at"])
    notify(recipients=[friendship.requester], kind=Notification.Kind.FRIEND_ACCEPTED, actor=friendship.addressee)
    return friendship


def delete_friendship(*, friendship: Friendship) -> None:
    """Rechazar o cancelar una solicitud, o dejar de ser amigos."""
    friendship.delete()
