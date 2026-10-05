from rest_framework import serializers

from apps.events.serializers import EventListSerializer
from apps.groups.serializers import GroupRefSerializer
from apps.stats.serializers import LevelSerializer
from apps.users.serializers import UserSerializer


class UserProfileSerializer(serializers.Serializer):
    user = UserSerializer()
    date_joined = serializers.DateTimeField()
    relationship = serializers.CharField()
    pending_request_id = serializers.IntegerField(allow_null=True)
    friends_count = serializers.IntegerField()
    points = serializers.IntegerField()
    level = LevelSerializer()
    # null si no son amigos (las estadísticas son solo para amigos).
    stats = serializers.DictField(child=serializers.IntegerField(), allow_null=True)
    common_groups = GroupRefSerializer(many=True)
    shared_upcoming = EventListSerializer(many=True)
