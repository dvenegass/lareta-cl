from apps.events.models import EventParticipant
from apps.users.models import User

from .models import Expense
from .splitting import compute_balances, settle


def expense_summary(event) -> dict:
    """Gastos de la junta, cuánto le toca a cada uno y cómo quedar a mano."""
    expenses = list(Expense.objects.filter(event=event).select_related("paid_by", "event"))
    sharer_ids = list(
        EventParticipant.objects.filter(event=event, status=EventParticipant.Status.GOING).values_list(
            "user_id", flat=True
        )
    )

    balances = compute_balances([(e.paid_by_id, e.amount) for e in expenses], sharer_ids)
    transfers = settle({user_id: b["balance"] for user_id, b in balances.items()})
    users = User.objects.in_bulk(balances.keys())
    total = sum(e.amount for e in expenses)

    return {
        "expenses": expenses,
        "total": total,
        "people_count": len(sharer_ids),
        "per_person": round(total / len(sharer_ids)) if sharer_ids else 0,
        "balances": sorted(
            ({"user": users[user_id], **values} for user_id, values in balances.items()),
            key=lambda row: row["balance"],
            reverse=True,
        ),
        "settlements": [
            {"from_user": users[debtor], "to_user": users[creditor], "amount": amount}
            for debtor, creditor, amount in transfers
        ],
    }
