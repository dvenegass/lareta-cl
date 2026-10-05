from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import Event

from . import services
from .models import EventPhoto
from .serializers import EventPhotoSerializer, EventPhotoUploadSerializer


class EventPhotosView(APIView):
    """Cualquiera con el enlace ve el álbum; suben fotos quienes pueden unirse, una vez empezada."""

    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        photos = EventPhoto.objects.filter(event=event).select_related("uploaded_by", "event")
        return Response(EventPhotoSerializer(photos, many=True, context={"request": request}).data)

    def post(self, request, event_id):
        event = get_object_or_404(Event.objects.select_related("group"), pk=event_id)
        reason = services.upload_denied_reason(event=event, user=request.user)
        if reason:
            raise PermissionDenied(reason)
        serializer = EventPhotoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        photo = services.add_photo(event=event, uploaded_by=request.user, image=serializer.validated_data["image"])

        return Response(EventPhotoSerializer(photo, context={"request": request}).data, status=status.HTTP_201_CREATED)


class PhotoDetailView(APIView):
    def delete(self, request, photo_id):
        photo = get_object_or_404(EventPhoto.objects.select_related("event"), pk=photo_id)
        if not services.can_delete_photo(photo=photo, user=request.user):
            raise PermissionDenied("Solo quien la subió (o el organizador) puede borrarla.")
        services.delete_photo(photo=photo)
        return Response(status=status.HTTP_204_NO_CONTENT)
