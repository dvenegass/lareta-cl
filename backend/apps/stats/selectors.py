"""
Estadísticas calculadas a partir de los datos reales (juntas, llegadas, votaciones,
gastos). No se guardan: así nunca quedan desincronizadas y nadie puede sumar
puntos confirmando y desconfirmando.
"""

from collections import Counter

from django.db.models import Count, F, Q, Sum
from django.db.models.functions import Lower, Trim
from django.utils import timezone

from apps.events.models import Event, EventParticipant
from apps.expenses.models import Expense
from apps.friends.selectors import friend_ids
from apps.groups.selectors import member_ids
from apps.polls.models import Poll
from apps.users.models import User

from .rules import BIG_EVENT_MIN_ATTENDEES, LEVELS, POINT_RULES, RANKING_SIZE, RANKINGS, level_for, points_for

STAT_KEYS = (
    "events_organized",  # juntas creadas que ya pasaron y a las que confirmó alguien más
    "big_events",  # juntas creadas con BIG_EVENT_MIN_ATTENDEES+ llegadas
    "confirmations",  # juntas en las que dijo "Asistiré"
    "attended",  # llegó (a tiempo o tarde), según marcó el organizador
    "on_time",
    "late",
    "cancelled",  # confirmó y después se bajó
    "polls_created",
    "places",  # lugares distintos a los que llegó
    "spent",  # pesos: gastos compartidos que pagó + cuotas fijas pagadas
)

ARRIVED = [EventParticipant.Arrival.ON_TIME, EventParticipant.Arrival.LATE]


def friends_circle_ids(user) -> list[int]:
    """El usuario y sus amigos."""
    return sorted(friend_ids(user) | {user.id})


def compute_stats(user_ids: list[int]) -> dict[int, dict[str, int]]:
    stats = {user_id: dict.fromkeys(STAT_KEYS, 0) for user_id in user_ids}

    def add(stat: str, rows):
        for user_id, value in rows:
            stats[user_id][stat] += value or 0

    def count_by(queryset, field: str):
        return queryset.order_by().values(field).annotate(n=Count("pk")).values_list(field, "n")

    # Juntas organizadas (contamos en Python: no se puede agrupar sobre un agregado)
    others_going = Count(
        "participants",
        filter=Q(participants__status=EventParticipant.Status.GOING) & ~Q(participants__user=F("creator")),
    )
    # Las juntas canceladas no cuentan para nada.
    events = Event.objects.filter(cancelled_at__isnull=True)

    organized = (
        events.filter(creator_id__in=user_ids, starts_at__lt=timezone.now())
        .annotate(others=others_going)
        .filter(others__gte=1)
    )
    add("events_organized", Counter(organized.values_list("creator_id", flat=True)).items())

    big = (
        events.filter(creator_id__in=user_ids)
        .annotate(arrivals=Count("participants", filter=Q(participants__arrival__in=ARRIVED)))
        .filter(arrivals__gte=BIG_EVENT_MIN_ATTENDEES)
    )
    add("big_events", Counter(big.values_list("creator_id", flat=True)).items())

    participations = EventParticipant.objects.filter(user_id__in=user_ids, event__cancelled_at__isnull=True)
    add("confirmations", count_by(participations.filter(status=EventParticipant.Status.GOING), "user_id"))
    add("attended", count_by(participations.filter(arrival__in=ARRIVED), "user_id"))
    add("on_time", count_by(participations.filter(arrival=EventParticipant.Arrival.ON_TIME), "user_id"))
    add("late", count_by(participations.filter(arrival=EventParticipant.Arrival.LATE), "user_id"))
    add("cancelled", count_by(participations.filter(has_cancelled=True), "user_id"))
    add("polls_created", count_by(Poll.objects.filter(created_by_id__in=user_ids), "created_by_id"))

    # "Casa de Diego" y "casa de diego " cuentan como el mismo lugar.
    add(
        "places",
        participations.filter(arrival__in=ARRIVED)
        .order_by()
        .values("user_id")
        .annotate(n=Count(Lower(Trim("event__location")), distinct=True))
        .values_list("user_id", "n"),
    )

    add(
        "spent",
        Expense.objects.filter(paid_by_id__in=user_ids, event__cancelled_at__isnull=True)
        .order_by()
        .values("paid_by_id")
        .annotate(total=Sum("amount"))
        .values_list("paid_by_id", "total"),
    )
    add(
        "spent",
        participations.filter(fee_paid=True, event__money_mode=Event.MoneyMode.FIXED)
        .order_by()
        .values("user_id")
        .annotate(total=Sum("event__fee_amount"))
        .values_list("user_id", "total"),
    )

    for user_stats in stats.values():
        user_stats["points"] = points_for(user_stats)
    return stats


def profile_stats(user) -> dict:
    """Puntos, nivel y desglose del usuario."""
    stats = compute_stats([user.id])[user.id]
    level, next_level = level_for(stats["points"])
    return {
        "points": stats["points"],
        "level": level,
        "next_level": next_level,
        "max_level": LEVELS[-1].number,
        "breakdown": [
            {"label": rule.label, "count": stats[rule.stat], "points": stats[rule.stat] * rule.points}
            for rule in POINT_RULES
        ],
        "stats": stats,
    }


def rankings_for(user, group=None) -> dict:
    """Top de cada ranking entre el usuario y sus amigos, o entre los miembros de un grupo."""
    user_ids = member_ids(group) if group else friends_circle_ids(user)
    stats = compute_stats(user_ids)
    users = User.objects.in_bulk(user_ids)

    rankings = []
    for ranking in RANKINGS:
        candidates = [(user_stats[ranking.stat], users[uid]) for uid, user_stats in stats.items()]
        top = sorted(
            (candidate for candidate in candidates if candidate[0] > 0),
            key=lambda candidate: (-candidate[0], candidate[1].username.lower()),
        )[:RANKING_SIZE]
        rankings.append(
            {
                "key": ranking.key,
                "title": ranking.title,
                "unit": ranking.unit,
                "entries": [{"user": entry_user, "value": value} for value, entry_user in top],
            }
        )
    return {"group": group, "people_count": len(user_ids), "rankings": rankings}
