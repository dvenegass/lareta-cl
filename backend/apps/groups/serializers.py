from rest_framework import serializers

from apps.friends.selectors import friend_ids
from apps.users.models import User
from apps.users.serializers import UserSerializer

from .models import Group

MEMBERS_PREVIEW = 5
MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB


class GroupRefSerializer(serializers.ModelSerializer):
    """Lo mínimo para mostrar a qué grupo pertenece algo (p. ej. una junta)."""

    class Meta:
        model = Group
        fields = ["id", "name", "photo"]


class GroupSummarySerializer(serializers.ModelSerializer):
    """Para la lista "Mis grupos"."""

    member_count = serializers.IntegerField(read_only=True)
    members_preview = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ["id", "name", "description", "photo", "member_count", "members_preview"]

    def get_members_preview(self, group):
        memberships = group.memberships.all()[:MEMBERS_PREVIEW]
        return UserSerializer([m.user for m in memberships], many=True, context=self.context).data


class GroupMemberSerializer(serializers.Serializer):
    user = UserSerializer()
    joined_at = serializers.DateTimeField()
    is_owner = serializers.BooleanField()


class GroupDetailSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ["id", "name", "description", "photo", "owner", "members", "is_owner", "created_at"]

    def get_members(self, group):
        rows = [
            {"user": m.user, "joined_at": m.joined_at, "is_owner": m.user_id == group.owner_id}
            for m in group.memberships.all()
        ]
        return GroupMemberSerializer(rows, many=True, context=self.context).data

    def get_is_owner(self, group):
        return group.owner_id == self.context["request"].user.id


class GroupWriteSerializer(serializers.ModelSerializer):
    """Editar el grupo. `photo` acepta un archivo (multipart) o null para quitarla."""

    class Meta:
        model = Group
        fields = ["name", "description", "photo"]
        extra_kwargs = {"photo": {"allow_null": True}}

    def validate_photo(self, value):
        if value and value.size > MAX_PHOTO_BYTES:
            raise serializers.ValidationError("La foto no puede pesar más de 5 MB.")
        return value


def _validate_friends(request, user_ids: list[int]) -> list[User]:
    """Solo se puede agregar a un grupo a tus amigos."""
    friends = friend_ids(request.user)
    not_friends = set(user_ids) - friends
    if not_friends:
        raise serializers.ValidationError("Solo puedes agregar a tus amigos.")
    return list(User.objects.filter(pk__in=user_ids))


class GroupCreateSerializer(serializers.ModelSerializer):
    member_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)

    class Meta:
        model = Group
        fields = ["name", "description", "member_ids"]

    def validate_member_ids(self, value):
        return _validate_friends(self.context["request"], value)


class AddMemberSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        if self.context["group"].memberships.filter(user_id=value).exists():
            raise serializers.ValidationError("Ya está en el grupo.")
        return _validate_friends(self.context["request"], [value])[0]
