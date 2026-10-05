from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bringlist.services import add_items
from apps.groups.selectors import member_groups

from . import selectors, services
from .models import Event, EventParticipant
from .permissions import IsEventCreatorOrReadOnly
from .serializers import (
    AttendanceSerializer,
    CancelEventSerializer,
    EventCreateSerializer,
    EventDetailSerializer,
    EventHistorySerializer,
    EventListSerializer,
    EventWriteSerializer,
    ParticipantUpdateSerializer,
)


def _detail_response(request, event_id, status_code=status.HTTP_200_OK):
    """Vuelve a leer la junta para devolverla con contadores y asistentes al día."""
    event = selectors.get_event_detail(event_id=event_id, user=request.user)
    data = EventDetailSerializer(event, context={"request": request}).data
    return Response(data, status=status_code)


class EventListCreateView(APIView):
    # ?scope=… → (consulta, serializador)
    LIST_SCOPES = {
        "upcoming": (selectors.upcoming_events_for_user, EventListSerializer),
        "created": (selectors.events_created_by, EventListSerializer),
        "past": (selectors.past_events_for_user, EventHistorySerializer),
    }

    def get(self, request):
        # ?group=<id> → próximas juntas de ese grupo (solo para sus miembros).
        group_id = request.query_params.get("group")
        if group_id:
            group = get_object_or_404(member_groups(request.user), pk=group_id)
            events = selectors.upcoming_events_for_group(group, request.user)
            serializer_class = EventListSerializer
        else:
            scope = request.query_params.get("scope", "upcoming")
            if scope not in self.LIST_SCOPES:
                raise serializers.ValidationError({"scope": f"Usa uno de: {', '.join(self.LIST_SCOPES)}."})
            selector, serializer_class = self.LIST_SCOPES[scope]
            events = selector(request.user)

        return Response(serializer_class(events, many=True, context={"request": request}).data)

    def post(self, request):
        serializer = EventCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        bring_items = data.pop("bring_items")

        # La junta y su lista de "qué llevar" se crean juntas (o ninguna, si algo falla).
        with transaction.atomic():
            event = services.create_event(creator=request.user, **data)
            if event.bring_list_enabled and bring_items:
                add_items(event=event, created_by=request.user, names=bring_items)

        return _detail_response(request, event.pk, status.HTTP_201_CREATED)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated, IsEventCreatorOrReadOnly]

    def get_object(self, request, event_id):
        event = get_object_or_404(selectors.event_detail_queryset(request.user), pk=event_id)
        self.check_object_permissions(request, event)
        return event

    def get(self, request, event_id):
        event = self.get_object(request, event_id)
        return Response(EventDetailSerializer(event, context={"request": request}).data)

    def put(self, request, event_id):
        return self._update(request, event_id, partial=False)

    def patch(self, request, event_id):
        return self._update(request, event_id, partial=True)

    def delete(self, request, event_id):
        event = self.get_object(request, event_id)
        services.delete_event(event=event)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _update(self, request, event_id, partial):
        event = self.get_object(request, event_id)
        serializer = EventWriteSerializer(event, data=request.data, partial=partial, context={"request": request})
        serializer.is_valid(raise_exception=True)

        services.update_event(event=event, **serializer.validated_data)

        return _detail_response(request, event_id)


class EventAttendanceView(APIView):
    """La respuesta del usuario actual a una junta."""

    def put(self, request, event_id):
        event = get_object_or_404(Event.objects.select_related("group"), pk=event_id)
        if not services.can_respond(event=event, user=request.user):
            raise PermissionDenied(services.respond_denied_message(event))
        serializer = AttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.set_attendance(event=event, user=request.user, **serializer.validated_data)

        return _detail_response(request, event_id)


class EventCancelView(APIView):
    """POST: el organizador cancela la junta (con un motivo opcional). DELETE: la reactiva."""

    def _get_own_event(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        if event.creator_id != request.user.id:
            raise PermissionDenied("Solo quien organiza la junta puede cancelarla o reactivarla.")
        return event

    def post(self, request, event_id):
        event = self._get_own_event(request, event_id)
        serializer = CancelEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.cancel_event(event=event, **serializer.validated_data)

        return _detail_response(request, event_id)

    def delete(self, request, event_id):
        event = self._get_own_event(request, event_id)
        services.reactivate_event(event=event)
        return _detail_response(request, event_id)


class EventParticipantView(APIView):
    """El organizador marca la llegada o el pago de la cuota de un participante."""

    def patch(self, request, event_id, user_id):
        event = get_object_or_404(Event, pk=event_id)
        if event.creator_id != request.user.id:
            raise PermissionDenied("Solo quien organiza la junta puede marcar esto.")
        participant = get_object_or_404(EventParticipant, event=event, user_id=user_id)

        serializer = ParticipantUpdateSerializer(data=request.data, partial=True, context={"event": event})
        serializer.is_valid(raise_exception=True)

        services.update_participant(participant=participant, **serializer.validated_data)

        return _detail_response(request, event_id)
