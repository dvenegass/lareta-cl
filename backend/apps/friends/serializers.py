from rest_framework import serializers

from apps.users.models import User
from apps.users.serializers import UserSerializer

from .models import Friendship
from .selectors import find_friendship


class FriendRequestSerializer(serializers.ModelSerializer):
    """Una solicitud vista desde el usuario actual: `user` es la otra persona."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ["id", "user", "created_at"]

    def get_user(self, friendship):
        me = self.context["request"].user
        other = friendship.addressee if friendship.requester_id == me.id else friendship.requester
        return UserSerializer(other, context=self.context).data


class FriendRequestCreateSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate_username(self, value):
        me = self.context["request"].user
        user = User.objects.filter(username__iexact=value.strip(), is_active=True).first()
        if user is None:
            raise serializers.ValidationError("No existe nadie con ese nombre de usuario.")
        if user == me:
            raise serializers.ValidationError("No puedes agregarte a ti mismo.")

        existing = find_friendship(me, user)
        if existing and existing.status == Friendship.Status.ACCEPTED:
            raise serializers.ValidationError("Ya son amigos.")
        if existing and existing.requester_id == me.id:
            raise serializers.ValidationError("Ya le enviaste una solicitud.")
        # Si la solicitud existente es de la otra persona, se acepta al enviar (ver services).
        return user


class UserSearchResultSerializer(serializers.Serializer):
    user = UserSerializer()
    relationship = serializers.ChoiceField(choices=["friends", "request_sent", "request_received", "none"])
