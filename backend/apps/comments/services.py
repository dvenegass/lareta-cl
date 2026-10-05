"""Operaciones sobre los comentarios de una junta."""

from .models import Comment


def add_comment(*, event, author, body: str) -> Comment:
    return Comment.objects.create(event=event, author=author, body=body)


def delete_comment(*, comment: Comment) -> None:
    comment.delete()


def can_delete_comment(*, comment: Comment, user) -> bool:
    """Lo borra quien lo escribió o quien organiza la junta."""
    return user.id in (comment.author_id, comment.event.creator_id)
