from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import Comment
from .services import can_delete_comment


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "author", "body", "created_at", "can_delete"]

    def get_can_delete(self, comment):
        return can_delete_comment(comment=comment, user=self.context["request"].user)


class CommentCreateSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=1000)

    def validate_body(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Escribe algo.")
        return value
