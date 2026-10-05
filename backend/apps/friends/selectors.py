from django.db.models import Q, QuerySet
from django.db.models.functions import Lower

from apps.users.models import User

from .models import Friendship

SEARCH_LIMIT = 10


def _involving(user) -> QuerySet:
    return Friendship.objects.filter(Q(requester=user) | Q(addressee=user))


def friend_ids(user) -> set[int]:
    rows = _involving(user).filter(status=Friendship.Status.ACCEPTED).values_list("requester_id", "addressee_id")
    return {requester if addressee == user.id else addressee for requester, addressee in rows}


def friends_of(user) -> QuerySet:
    return User.objects.filter(pk__in=friend_ids(user)).order_by(Lower("username"))


def find_friendship(user_a, user_b) -> Friendship | None:
    """La relación entre dos personas, en cualquier dirección (o None)."""
    return Friendship.objects.filter(
        Q(requester=user_a, addressee=user_b) | Q(requester=user_b, addressee=user_a)
    ).first()


def pending_requests(user) -> dict[str, QuerySet]:
    pending = Friendship.objects.filter(status=Friendship.Status.PENDING).select_related("requester", "addressee")
    return {
        "incoming": pending.filter(addressee=user),
        "outgoing": pending.filter(requester=user),
    }


def relationship_with(user, others: list[User]) -> dict[int, str]:
    """
    Para cada persona: "friends", "request_sent" (yo le pedí), "request_received"
    (me pidió) o "none".
    """
    statuses = {other.id: "none" for other in others}
    for friendship in _involving(user).filter(Q(requester__in=others) | Q(addressee__in=others)):
        other_id = friendship.addressee_id if friendship.requester_id == user.id else friendship.requester_id
        if friendship.status == Friendship.Status.ACCEPTED:
            statuses[other_id] = "friends"
        elif friendship.requester_id == user.id:
            statuses[other_id] = "request_sent"
        else:
            statuses[other_id] = "request_received"
    return statuses


def search_users(user, query: str) -> list[User]:
    return list(
        User.objects.filter(username__icontains=query, is_active=True)
        .exclude(pk=user.pk)
        .order_by(Lower("username"))[:SEARCH_LIMIT]
    )
