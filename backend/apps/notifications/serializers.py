from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .messages import notification_target, notification_text
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True, allow_null=True)
    text = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "kind", "text", "target", "actor", "created_at", "is_read"]

    def get_text(self, notification):
        return notification_text(notification)

    def get_target(self, notification):
        return notification_target(notification)

    def get_is_read(self, notification):
        return notification.read_at is not None
