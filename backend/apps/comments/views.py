from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import Event
from apps.events.services import can_respond, respond_denied_message

from . import services
from .models import Comment
from .serializers import CommentCreateSerializer, CommentSerializer

# Se muestran los últimos N comentarios (en orden cronológico).
COMMENTS_LIMIT = 100


class EventCommentsView(APIView):
    """Cualquiera con el enlace los lee; escriben quienes pueden unirse a la junta."""

    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        latest = Comment.objects.filter(event=event).select_related("author", "event").order_by("-created_at")
        comments = list(latest[:COMMENTS_LIMIT])[::-1]
        return Response(CommentSerializer(comments, many=True, context={"request": request}).data)

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        if not event.comments_enabled:
            raise ValidationError({"detail": "Esta junta no tiene comentarios activados."})
        if not can_respond(event=event, user=request.user):
            raise PermissionDenied(respond_denied_message(event))
        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = services.add_comment(event=event, author=request.user, body=serializer.validated_data["body"])

        return Response(
            CommentSerializer(comment, context={"request": request}).data, status=status.HTTP_201_CREATED
        )


class CommentDetailView(APIView):
    def delete(self, request, comment_id):
        comment = get_object_or_404(Comment.objects.select_related("event"), pk=comment_id)
        if not services.can_delete_comment(comment=comment, user=request.user):
            raise PermissionDenied("Solo quien lo escribió (o el organizador) puede borrarlo.")
        services.delete_comment(comment=comment)
        return Response(status=status.HTTP_204_NO_CONTENT)
