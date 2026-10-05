"""Operaciones sobre el álbum de una junta."""

from django.utils import timezone

from apps.common.images import prepare_image
from apps.events.services import can_respond

from .models import EventPhoto

# Para que un álbum no crezca sin control.
MAX_PHOTOS_PER_EVENT = 200


def upload_denied_reason(*, event, user) -> str | None:
    """Por qué el usuario no puede subir fotos a esta junta (None = sí puede)."""
    if event.is_cancelled:
        return "Esta junta fue cancelada."
    if event.starts_at > timezone.now():
        return "Las fotos se suben cuando la junta ya empezó."
    if not can_respond(event=event, user=user):
        return "Solo quienes pueden unirse a la junta pueden subir fotos."
    if event.photos.count() >= MAX_PHOTOS_PER_EVENT:
        return f"El álbum ya tiene el máximo de {MAX_PHOTOS_PER_EVENT} fotos."
    return None


def add_photo(*, event, uploaded_by, image) -> EventPhoto:
    prepared = prepare_image(image)
    photo = EventPhoto(event=event, uploaded_by=uploaded_by)
    photo.image.save(prepared.name, prepared, save=False)
    photo.save()
    return photo


def delete_photo(*, photo: EventPhoto) -> None:
    photo.delete()  # el archivo lo borra la señal de apps.py


def can_delete_photo(*, photo: EventPhoto, user) -> bool:
    """La borra quien la subió o quien organiza la junta."""
    return user.id in (photo.uploaded_by_id, photo.event.creator_id)
