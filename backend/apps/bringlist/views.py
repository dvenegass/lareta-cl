from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import Event
from apps.events.services import can_respond, respond_denied_message

from . import services
from .models import BringItem
from .serializers import BringItemCreateSerializer, BringItemSerializer, BringItemUpdateSerializer


def _require_can_participate(request, event):
    if not event.bring_list_enabled:
        raise serializers.ValidationError({"detail": "Esta junta no tiene la lista de qué llevar activada."})
    if not can_respond(event=event, user=request.user):
        raise PermissionDenied(respond_denied_message(event))


def _list_response(request, event, status_code=status.HTTP_200_OK):
    """Todas las acciones devuelven la lista completa, así el frontend la reemplaza tal cual."""
    items = BringItem.objects.filter(event=event).select_related("assigned_to", "event")
    return Response(BringItemSerializer(items, many=True, context={"request": request}).data, status=status_code)


class EventItemsView(APIView):
    def get(self, request, event_id):
        return _list_response(request, get_object_or_404(Event, pk=event_id))

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        _require_can_participate(request, event)
        serializer = BringItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.add_item(event=event, created_by=request.user, name=serializer.validated_data["name"])

        return _list_response(request, event, status.HTTP_201_CREATED)


class ItemDetailView(APIView):
    def patch(self, request, item_id):
        item = get_object_or_404(BringItem.objects.select_related("event"), pk=item_id)
        _require_can_participate(request, item.event)
        serializer = BringItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data["claim"]:
            if item.assigned_to_id not in (None, request.user.id):
                raise serializers.ValidationError({"detail": "Alguien más ya lo lleva."})
            services.claim_item(item=item, user=request.user)
        else:
            if not services.can_release_item(item=item, user=request.user):
                raise PermissionDenied("Solo quien lo lleva (o el organizador) puede soltarlo.")
            services.release_item(item=item)

        return _list_response(request, item.event)

    def delete(self, request, item_id):
        item = get_object_or_404(BringItem.objects.select_related("event"), pk=item_id)
        if not services.can_delete_item(item=item, user=request.user):
            raise PermissionDenied("Solo quien lo agregó (o el organizador) puede borrarlo.")
        event = item.event
        services.delete_item(item=item)
        return _list_response(request, event)
