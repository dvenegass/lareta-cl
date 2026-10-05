from django.db.models import Count, Prefetch, QuerySet

from .models import Poll, PollOption, PollVote


def _polls_with_counts() -> QuerySet:
    """Votaciones con el conteo de votos ya calculado en cada opción (`vote_count`)."""
    options = PollOption.objects.annotate(vote_count=Count("votes")).order_by("position")
    return Poll.objects.select_related("created_by", "event").prefetch_related(
        Prefetch("options", queryset=options)
    )


def polls_for_event(event) -> QuerySet:
    return _polls_with_counts().filter(event=event)


def get_poll(poll_id) -> Poll:
    return _polls_with_counts().get(pk=poll_id)


def votes_by_user(user, polls) -> dict[int, int]:
    """{poll_id: option_id} con lo que votó el usuario en esas votaciones."""
    votes = PollVote.objects.filter(user=user, poll__in=polls).values_list("poll_id", "option_id")
    return dict(votes)
