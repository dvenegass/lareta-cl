"""Operaciones de escritura sobre grupos."""

from django.db import transaction

from apps.notifications.models import Notification
from apps.notifications.services import notify

from .models import Group, GroupMembership


@transaction.atomic
def create_group(*, owner, name: str, description: str = "", members=()) -> Group:
    group = Group.objects.create(owner=owner, name=name, description=description)
    GroupMembership.objects.create(group=group, user=owner, added_by=owner)
    for user in members:
        add_member(group=group, user=user, added_by=owner)
    return group


def update_group(*, group: Group, **data) -> Group:
    if "photo" in data:
        new_photo = data.pop("photo")
        # Borra el archivo anterior para no acumular imágenes huérfanas.
        if group.photo:
            group.photo.delete(save=False)
        group.photo = new_photo or ""

    for field, value in data.items():
        setattr(group, field, value)
    group.save()
    return group


def delete_group(*, group: Group) -> None:
    # Las juntas del grupo no se borran: quedan como juntas "solo por enlace".
    if group.photo:
        group.photo.delete(save=False)
    group.delete()


def add_member(*, group: Group, user, added_by) -> GroupMembership:
    membership, created = GroupMembership.objects.get_or_create(
        group=group, user=user, defaults={"added_by": added_by}
    )
    if created:
        notify(recipients=[user], kind=Notification.Kind.GROUP_ADDED, actor=added_by, group=group)
    return membership


@transaction.atomic
def remove_member(*, group: Group, user) -> Group | None:
    """
    Saca a alguien (o es alguien que se sale). Si se va quien administra, el
    grupo pasa al miembro más antiguo; si no queda nadie, el grupo se borra.
    Devuelve el grupo, o None si se borró.
    """
    GroupMembership.objects.filter(group=group, user=user).delete()

    if group.owner_id == user.id:
        next_member = group.memberships.order_by("joined_at").select_related("user").first()
        if next_member is None:
            group.delete()
            return None
        group.owner = next_member.user
        group.save(update_fields=["owner"])
    return group


def can_manage(*, group: Group, user) -> bool:
    return group.owner_id == user.id
