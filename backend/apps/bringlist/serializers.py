from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import BringItem
from .services import can_delete_item, can_release_item


class BringItemSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True, allow_null=True)
    can_delete = serializers.SerializerMethodField()
    can_release = serializers.SerializerMethodField()

    class Meta:
        model = BringItem
        fields = ["id", "name", "assigned_to", "can_delete", "can_release", "created_at"]

    def get_can_delete(self, item):
        return can_delete_item(item=item, user=self.context["request"].user)

    def get_can_release(self, item):
        return item.assigned_to_id is not None and can_release_item(item=item, user=self.context["request"].user)


class BringItemCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Escribe qué hay que llevar.")
        return value


class BringItemUpdateSerializer(serializers.Serializer):
    """{"claim": true} = yo lo llevo; {"claim": false} = lo suelto."""

    claim = serializers.BooleanField()
