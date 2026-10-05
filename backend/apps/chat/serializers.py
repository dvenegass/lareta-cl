from rest_framework import serializers

from apps.common.images import validate_uploaded_image
from apps.users.serializers import UserSerializer

from . import gifs
from .models import GroupMessage
from .services import can_delete_message


class GroupMessageBaseSerializer(serializers.ModelSerializer):
    """El mensaje tal cual, igual para todos (es lo que se envía por WebSocket)."""

    author = UserSerializer(read_only=True)

    class Meta:
        model = GroupMessage
        fields = [
            "id",
            "author",
            "body",
            "image",
            "image_width",
            "image_height",
            "gif_url",
            "gif_width",
            "gif_height",
            "created_at",
        ]


class GroupMessageSerializer(GroupMessageBaseSerializer):
    """El mensaje visto por un usuario concreto: además dice si puede borrarlo."""

    can_delete = serializers.SerializerMethodField()

    class Meta(GroupMessageBaseSerializer.Meta):
        fields = GroupMessageBaseSerializer.Meta.fields + ["can_delete"]

    def get_can_delete(self, message):
        return can_delete_message(message=message, user=self.context["request"].user)


class GroupMessageCreateSerializer(serializers.Serializer):
    """
    Un mensaje nuevo: texto, una imagen o un GIF de KLIPY (o texto + uno de ellos).
    Con imagen se envía como multipart; si no, como JSON.
    """

    body = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")
    image = serializers.ImageField(required=False)
    gif_url = serializers.URLField(max_length=500, required=False)
    gif_width = serializers.IntegerField(required=False, min_value=1, max_value=4000)
    gif_height = serializers.IntegerField(required=False, min_value=1, max_value=4000)

    def validate_body(self, value):
        return value.strip()

    def validate_image(self, value):
        return validate_uploaded_image(value)

    def validate_gif_url(self, value):
        if not gifs.is_klipy_url(value):
            raise serializers.ValidationError("Ese GIF no viene de KLIPY.")
        return value

    def validate(self, attrs):
        has_image = "image" in attrs
        has_gif = "gif_url" in attrs
        if has_image and has_gif:
            raise serializers.ValidationError({"detail": "Envía una imagen o un GIF, no ambos."})
        if not (attrs["body"] or has_image or has_gif):
            raise serializers.ValidationError({"body": "Escribe algo o adjunta una imagen."})
        return attrs


class MessagesQuerySerializer(serializers.Serializer):
    """Parámetros opcionales de la URL: ?after=<id> o ?before=<id>."""

    after = serializers.IntegerField(required=False, min_value=0)
    before = serializers.IntegerField(required=False, min_value=1)


class GifSearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, default="", max_length=80)
    page = serializers.IntegerField(required=False, default=1, min_value=1, max_value=50)
