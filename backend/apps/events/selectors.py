"""Consultas de lectura sobre juntas. Las vistas no construyen queries a mano."""

from django.db.models import Count, IntegerField, OuterRef, Prefetch, Q, QuerySet, Subquery
from django.utils import timezone

from apps.groups.models import GroupMembership
from apps.photos.models import EventPhoto

from .models import Event, EventParticipant


def _with_summary(events: QuerySet, user) -> QuerySet:
    """Añade `going_count` y `my_status` (la respuesta del usuario, o None)."""
    my_status = EventParticipant.objects.filter(event=OuterRef("pk"), user=user).values("status")[:1]
    return events.select_related("creator", "group").annotate(
        going_count=Count(
            "participants",
            filter=Q(participants__status=EventParticipant.Status.GOING),
        ),
        my_status=Subquery(my_status),
    )


def _upcoming(events: QuerySet) -> QuerySet:
    # Desde hoy: una junta en curso no desaparece del feed.
    return events.filter(starts_at__date__gte=timezone.localdate())


def _related_to(user) -> QuerySet:
    """Juntas que el usuario creó, a las que respondió o que son de alguno de sus grupos."""
    my_group_ids = GroupMembership.objects.filter(user=user).values("group_id")
    related_ids = Event.objects.filter(
        Q(creator=user) | Q(participants__user=user) | Q(group_id__in=my_group_ids)
    ).values("pk")
    return Event.objects.filter(pk__in=related_ids)


def upcoming_events_for_user(user) -> QuerySet:
    """El feed: próximas juntas relacionadas con el usuario (también las canceladas, marcadas)."""
    return _with_summary(_upcoming(_related_to(user)), user).order_by("starts_at")


def past_events_for_user(user) -> QuerySet:
    """
    El historial: juntas pasadas relacionadas con el usuario, las más recientes
    primero, con cuántas fotos tiene su álbum y cuál usar de portada.
    Las canceladas no aparecen (no pasaron).
    """
    photos = EventPhoto.objects.filter(event=OuterRef("pk"))
    events = _related_to(user).filter(starts_at__date__lt=timezone.localdate(), cancelled_at__isnull=True)
    return (
        _with_summary(events, user)
        .annotate(
            # Subconsultas (y no Count): un segundo Count multiplicaría el de asistentes.
            photo_count=Subquery(
                photos.order_by().values("event").annotate(n=Count("pk")).values("n")[:1],
                output_field=IntegerField(),
            ),
            cover_image=Subquery(photos.order_by("created_at").values("image")[:1]),
        )
        .order_by("-starts_at")
    )


def shared_upcoming_events(viewer, other) -> QuerySet:
    """Próximas juntas en las que participan los dos (para el perfil de otra persona)."""
    viewer_events = EventParticipant.objects.filter(user=viewer).values("event_id")
    other_events = EventParticipant.objects.filter(user=other).values("event_id")
    events = _upcoming(Event.objects.filter(pk__in=viewer_events).filter(pk__in=other_events))
    return _with_summary(events, viewer).order_by("starts_at")


def upcoming_events_for_group(group, user) -> QuerySet:
    return _with_summary(_upcoming(Event.objects.filter(group=group)), user).order_by("starts_at")


def events_created_by(user) -> QuerySet:
    """Todas las juntas creadas por el usuario, las más recientes primero."""
    return _with_summary(Event.objects.filter(creator=user), user).order_by("-starts_at")


def event_detail_queryset(user) -> QuerySet:
    """Base para ver una junta: cualquier usuario con el enlace puede verla."""
    # Orden estable (por cuándo respondieron): marcar llegada o pago no reordena la lista.
    participants = EventParticipant.objects.select_related("user").order_by("created_at")
    return _with_summary(Event.objects.all(), user).prefetch_related(
        Prefetch("participants", queryset=participants)
    )


def get_event_detail(*, event_id, user) -> Event:
    return event_detail_queryset(user).get(pk=event_id)
