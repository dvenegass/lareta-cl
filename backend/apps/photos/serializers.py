from rest_framework import serializers

from apps.common.images import validate_uploaded_image
from apps.users.serializers import UserSerializer

from .models import EventPhoto
from .services import can_delete_photo


class EventPhotoSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = EventPhoto
        fields = ["id", "image", "width", "height", "uploaded_by", "created_at", "can_delete"]

    def get_can_delete(self, photo):
        return can_delete_photo(photo=photo, user=self.context["request"].user)


class EventPhotoUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate_image(self, value):
        return validate_uploaded_image(value)
