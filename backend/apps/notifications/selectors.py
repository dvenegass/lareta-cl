from django.db.models import QuerySet

from .models import Notification

LATEST_LIMIT = 30


def latest_notifications(user) -> QuerySet:
    return Notification.objects.filter(recipient=user).select_related("actor", "event__group", "group")[:LATEST_LIMIT]


def unread_count(user) -> int:
    return Notification.objects.filter(recipient=user, read_at__isnull=True).count()
