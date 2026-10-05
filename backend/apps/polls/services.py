"""Operaciones de escritura sobre votaciones."""

from django.db import transaction

from .models import Poll, PollOption, PollVote


@transaction.atomic
def create_poll(*, event, created_by, question: str, options: list[str]) -> Poll:
    poll = Poll.objects.create(event=event, created_by=created_by, question=question)
    PollOption.objects.bulk_create(
        PollOption(poll=poll, text=text, position=index) for index, text in enumerate(options)
    )
    return poll


def delete_poll(*, poll: Poll) -> None:
    poll.delete()


def vote(*, poll: Poll, user, option: PollOption) -> PollVote:
    """Vota o cambia el voto. Siempre queda un único voto por persona."""
    poll_vote, _ = PollVote.objects.update_or_create(poll=poll, user=user, defaults={"option": option})
    return poll_vote


def remove_vote(*, poll: Poll, user) -> None:
    PollVote.objects.filter(poll=poll, user=user).delete()


def can_delete_poll(*, poll: Poll, user) -> bool:
    """La borra quien la creó o quien organiza la junta."""
    return user.id in (poll.created_by_id, poll.event.creator_id)
