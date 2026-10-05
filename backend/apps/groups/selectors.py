from django.db.models import Count, Prefetch, QuerySet

from .models import Group, GroupMembership


def _with_members(groups: QuerySet) -> QuerySet:
    members = GroupMembership.objects.select_related("user").order_by("joined_at")
    return groups.select_related("owner").prefetch_related(Prefetch("memberships", queryset=members))


def _groups_of(user) -> QuerySet:
    # Filtramos con una subconsulta: si filtráramos por `memberships__user` y luego
    # contáramos `memberships`, el conteo solo vería la fila del usuario (siempre 1).
    return Group.objects.filter(pk__in=GroupMembership.objects.filter(user=user).values("group_id"))


def groups_for_user(user) -> QuerySet:
    """Los grupos en los que está el usuario, con el número de miembros."""
    return _with_members(_groups_of(user).annotate(member_count=Count("memberships"))).order_by("name")


def member_groups(user) -> QuerySet:
    """Base para abrir un grupo: solo sus miembros pueden verlo."""
    return _with_members(_groups_of(user))


def is_member(user, group_id) -> bool:
    return GroupMembership.objects.filter(group_id=group_id, user=user).exists()


def member_ids(group) -> list[int]:
    return list(group.memberships.values_list("user_id", flat=True))
