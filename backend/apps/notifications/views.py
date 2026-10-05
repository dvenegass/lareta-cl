from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import selectors, services
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    def get(self, request):
        services.create_due_reminders(user=request.user)
        notifications = selectors.latest_notifications(request.user)
        return Response(
            {
                "unread_count": selectors.unread_count(request.user),
                "results": NotificationSerializer(notifications, many=True, context={"request": request}).data,
            }
        )


class UnreadCountView(APIView):
    """Liviano: el frontend lo consulta cada cierto tiempo para el contador de la campana."""

    def get(self, request):
        services.create_due_reminders(user=request.user)
        return Response({"unread_count": selectors.unread_count(request.user)})


class NotificationReadView(APIView):
    def post(self, request, notification_id):
        notification = get_object_or_404(Notification, pk=notification_id, recipient=request.user)
        services.mark_read(notification=notification)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationReadAllView(APIView):
    def post(self, request):
        services.mark_all_read(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
