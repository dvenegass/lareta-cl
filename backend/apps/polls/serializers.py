from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import Poll, PollOption
from .services import can_delete_poll


class PollOptionSerializer(serializers.ModelSerializer):
    votes = serializers.IntegerField(source="vote_count", read_only=True)

    class Meta:
        model = PollOption
        fields = ["id", "text", "votes"]


class PollSerializer(serializers.ModelSerializer):
    """
    Necesita en el contexto `request` y `my_votes` ({poll_id: option_id}),
    que la vista calcula una sola vez para todas las votaciones.
    """

    created_by = UserSerializer(read_only=True)
    options = PollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()
    my_vote = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ["id", "question", "created_by", "created_at", "options", "total_votes", "my_vote", "can_delete"]

    def get_total_votes(self, poll):
        return sum(option.vote_count for option in poll.options.all())

    def get_my_vote(self, poll):
        return self.context["my_votes"].get(poll.id)

    def get_can_delete(self, poll):
        return can_delete_poll(poll=poll, user=self.context["request"].user)


class PollCreateSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=200)
    options = serializers.ListField(
        child=serializers.CharField(max_length=100),
        min_length=2,
        max_length=8,
    )

    def validate_options(self, value):
        cleaned = [text.strip() for text in value if text.strip()]
        if len(cleaned) < 2:
            raise serializers.ValidationError("Agrega al menos dos opciones.")
        if len({text.lower() for text in cleaned}) != len(cleaned):
            raise serializers.ValidationError("Las opciones no pueden repetirse.")
        return cleaned


class VoteSerializer(serializers.Serializer):
    option = serializers.IntegerField()

    def validate_option(self, value):
        poll = self.context["poll"]
        try:
            return poll.options.get(pk=value)
        except PollOption.DoesNotExist:
            raise serializers.ValidationError("Esa opción no es de esta votación.")
