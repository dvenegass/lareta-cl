"""
Perfil de un usuario visto por otro. Sin tablas propias: junta datos de
usuarios, amigos, grupos, juntas y estadísticas.
"""

from apps.events.selectors import shared_upcoming_events
from apps.friends.models import Friendship
from apps.friends.selectors import find_friendship, friend_ids
from apps.groups.models import Group, GroupMembership
from apps.stats.rules import level_for
from apps.stats.selectors import compute_stats

# Estadísticas que se muestran en el perfil (solo a amigos y a uno mismo).
PROFILE_STATS = ("attended", "on_time", "events_organized", "places")


def _relationship(viewer, user) -> tuple[str, int | None]:
    """("self" | "friends" | "request_sent" | "request_received" | "none", id de la solicitud pendiente)."""
    if viewer.id == user.id:
        return "self", None
    friendship = find_friendship(viewer, user)
    if friendship is None:
        return "none", None
    if friendship.status == Friendship.Status.ACCEPTED:
        return "friends", None
    if friendship.requester_id == viewer.id:
        return "request_sent", friendship.id
    return "request_received", friendship.id


def user_profile(*, viewer, user) -> dict:
    relationship, request_id = _relationship(viewer, user)
    stats = compute_stats([user.id])[user.id]
    level, _ = level_for(stats["points"])
    can_see_stats = relationship in ("self", "friends")

    # Grupos donde están los dos.
    viewer_groups = GroupMembership.objects.filter(user=viewer).values("group_id")
    common_groups = Group.objects.filter(pk__in=viewer_groups, memberships__user=user).order_by("name")

    return {
        "user": user,
        "date_joined": user.date_joined,
        "relationship": relationship,
        "pending_request_id": request_id,
        "friends_count": len(friend_ids(user)),
        "points": stats["points"],
        "level": level,
        "stats": {key: stats[key] for key in PROFILE_STATS} if can_see_stats else None,
        "common_groups": common_groups,
        # Solo juntas donde están los dos: nunca se muestran juntas ajenas al que mira.
        "shared_upcoming": shared_upcoming_events(viewer, user),
    }
