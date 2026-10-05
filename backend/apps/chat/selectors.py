"""
Lecturas del chat.

El frontend abre el chat con los últimos mensajes (`latest_messages`) y
después los nuevos le llegan por WebSocket. Si la conexión se corta, al
volver pide lo que se perdió (`messages_after`). Para ver lo anterior pide
"lo que hay antes del mensaje Y" (`messages_before`).
"""

from apps.groups.models import GroupMembership

from .models import GroupMessage

PAGE_SIZE = 50


def _messages(group):
    return GroupMessage.objects.filter(group=group).select_related("author", "group")


def latest_messages(group, limit: int = PAGE_SIZE) -> list[GroupMessage]:
    """Los últimos `limit` mensajes, del más antiguo al más nuevo."""
    return list(_messages(group).order_by("-id")[:limit])[::-1]


def messages_before(group, before_id: int, limit: int = PAGE_SIZE) -> list[GroupMessage]:
    return list(_messages(group).filter(id__lt=before_id).order_by("-id")[:limit])[::-1]


def messages_after(group, after_id: int, limit: int = 200) -> list[GroupMessage]:
    return list(_messages(group).filter(id__gt=after_id).order_by("id")[:limit])


def chat_access(user, group_id: int) -> dict | None:
    """
    ¿Puede `user` estar en el chat del grupo? None si no es miembro;
    si lo es, {"is_owner": bool} (quien administra puede borrar cualquier mensaje).
    """
    membership = (
        GroupMembership.objects.filter(group_id=group_id, user=user).values("group__owner_id").first()
    )
    if membership is None:
        return None
    return {"is_owner": membership["group__owner_id"] == user.id}
