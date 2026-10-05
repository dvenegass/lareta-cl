"""Operaciones sobre la lista de "qué llevar"."""

from .models import BringItem


def add_item(*, event, created_by, name: str) -> BringItem:
    return BringItem.objects.create(event=event, created_by=created_by, name=name)


def add_items(*, event, created_by, names: list[str]) -> list[BringItem]:
    """Varias de una vez (p. ej. la lista que se arma al crear la junta)."""
    return BringItem.objects.bulk_create(BringItem(event=event, created_by=created_by, name=name) for name in names)


def claim_item(*, item: BringItem, user) -> BringItem:
    """"Yo lo llevo"."""
    item.assigned_to = user
    item.save(update_fields=["assigned_to"])
    return item


def release_item(*, item: BringItem) -> BringItem:
    """Ya no lo llevo: queda libre para otro."""
    item.assigned_to = None
    item.save(update_fields=["assigned_to"])
    return item


def delete_item(*, item: BringItem) -> None:
    item.delete()


def can_delete_item(*, item: BringItem, user) -> bool:
    return user.id in (item.created_by_id, item.event.creator_id)


def can_release_item(*, item: BringItem, user) -> bool:
    """Lo suelta quien lo tomó, o el organizador."""
    return user.id in (item.assigned_to_id, item.event.creator_id)
