"""Operaciones de escritura sobre gastos."""

from .models import Expense


def add_expense(*, event, created_by, paid_by, description: str, amount: int) -> Expense:
    return Expense.objects.create(
        event=event,
        created_by=created_by,
        paid_by=paid_by,
        description=description,
        amount=amount,
    )


def delete_expense(*, expense: Expense) -> None:
    expense.delete()


def can_delete_expense(*, expense: Expense, user) -> bool:
    """Lo borra quien lo anotó, quien lo pagó o quien organiza la junta."""
    return user.id in (expense.created_by_id, expense.paid_by_id, expense.event.creator_id)
