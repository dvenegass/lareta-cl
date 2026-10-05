from rest_framework import serializers

from apps.groups.serializers import GroupRefSerializer
from apps.users.serializers import UserSerializer


class LevelSerializer(serializers.Serializer):
    number = serializers.IntegerField()
    name = serializers.CharField()
    min_points = serializers.IntegerField()


class BreakdownSerializer(serializers.Serializer):
    label = serializers.CharField()
    count = serializers.IntegerField()
    points = serializers.IntegerField()


class ProfileStatsSerializer(serializers.Serializer):
    points = serializers.IntegerField()
    level = LevelSerializer()
    next_level = LevelSerializer(allow_null=True)
    max_level = serializers.IntegerField()
    breakdown = BreakdownSerializer(many=True)
    stats = serializers.DictField(child=serializers.IntegerField())


class RankingEntrySerializer(serializers.Serializer):
    user = UserSerializer()
    value = serializers.IntegerField()


class RankingSerializer(serializers.Serializer):
    key = serializers.CharField()
    title = serializers.CharField()
    unit = serializers.CharField()
    entries = RankingEntrySerializer(many=True)


class RankingsSerializer(serializers.Serializer):
    group = GroupRefSerializer(allow_null=True)  # null = entre amigos
    people_count = serializers.IntegerField()
    rankings = RankingSerializer(many=True)
