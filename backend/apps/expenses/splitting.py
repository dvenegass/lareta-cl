"""
Cálculo de "quién le debe a quién". Funciones puras (sin base de datos) para que
sean fáciles de entender y de testear. Todo en pesos enteros.
"""


def split_evenly(total: int, user_ids: list[int]) -> dict[int, int]:
    """Reparte `total` en partes iguales. Los pesos que sobran van a los primeros."""
    if not user_ids:
        return {}
    base, remainder = divmod(total, len(user_ids))
    return {user_id: base + (1 if index < remainder else 0) for index, user_id in enumerate(sorted(user_ids))}


def compute_balances(payments: list[tuple[int, int]], sharer_ids: list[int]) -> dict[int, dict]:
    """
    payments: [(quién_pagó, monto), ...]
    sharer_ids: quienes dividen el total (los que asisten).
    Devuelve {user_id: {"paid", "share", "balance"}}. balance > 0 = le deben; < 0 = debe.
    """
    total = sum(amount for _, amount in payments)
    shares = split_evenly(total, sharer_ids)

    paid: dict[int, int] = {}
    for user_id, amount in payments:
        paid[user_id] = paid.get(user_id, 0) + amount

    balances = {}
    for user_id in set(paid) | set(shares):
        user_paid = paid.get(user_id, 0)
        user_share = shares.get(user_id, 0)
        balances[user_id] = {"paid": user_paid, "share": user_share, "balance": user_paid - user_share}
    return balances


def settle(balances: dict[int, int]) -> list[tuple[int, int, int]]:
    """
    Transferencias para quedar a mano: [(de, para, monto), ...].
    El que más debe le paga al que más le deben, hasta saldar todo.
    """
    debtors = sorted(((-b, uid) for uid, b in balances.items() if b < 0), reverse=True)
    creditors = sorted(((b, uid) for uid, b in balances.items() if b > 0), reverse=True)
    transfers = []

    i = j = 0
    while i < len(debtors) and j < len(creditors):
        owes, debtor = debtors[i]
        owed, creditor = creditors[j]
        amount = min(owes, owed)
        transfers.append((debtor, creditor, amount))
        debtors[i] = (owes - amount, debtor)
        creditors[j] = (owed - amount, creditor)
        if debtors[i][0] == 0:
            i += 1
        if creditors[j][0] == 0:
            j += 1
    return transfers
