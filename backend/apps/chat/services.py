"""Operaciones sobre el chat de un grupo."""

from django.db import transaction

from apps.common.images import prepare_image
from apps.groups.services import can_manage

from . import realtime
from .models import GroupMessage


def send_message(
    *, group, author, body: str = "", image=None, gif_url: str = "", gif_width=None, gif_height=None
) -> GroupMessage:
    message = GroupMessage(
        group=group,
        author=author,
        body=body,
        gif_url=gif_url,
        gif_width=gif_width,
        gif_height=gif_height,
    )
    if image is not None:
        prepared = prepare_image(image)
        message.image.save(prepared.name, prepared, save=False)
    message.save()
    # Se avisa cuando el mensaje ya está guardado, para no anunciar algo que luego se deshaga.
    transaction.on_commit(lambda: _announce_created(message))
    return message


def delete_message(*, message: GroupMessage) -> None:
    group_id, message_id = message.group_id, message.id
    message.delete()  # el archivo de la imagen lo borra la señal de apps.py
    transaction.on_commit(
        lambda: realtime.broadcast(group_id, {"type": "message.deleted", "id": message_id})
    )


def can_delete_message(*, message: GroupMessage, user) -> bool:
    """Lo borra quien lo escribió o quien administra el grupo."""
    return message.author_id == user.id or can_manage(group=message.group, user=user)


def _announce_created(message: GroupMessage) -> None:
    # Import local: el serializador importa este módulo (can_delete_message).
    from .serializers import GroupMessageBaseSerializer

    realtime.broadcast(
        message.group_id,
        {"type": "message.created", "message": GroupMessageBaseSerializer(message).data},
    )
