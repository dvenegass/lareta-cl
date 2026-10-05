import { ArrowRight, Trash2 } from "lucide-react";

import { useExpenses } from "../../hooks/useExpenses";
import type { User } from "../../types";
import { formatMoney } from "../../utils/money";
import { Avatar } from "../ui/Avatar";
import { SkeletonRows } from "../ui/Skeleton";
import { ExpenseForm } from "./ExpenseForm";
import styles from "./MoneyPanels.module.css";

type SharedExpensesPanelProps = {
  eventId: string;
  /** Quienes asisten: dividen la cuenta y pueden figurar como quien pagó. */
  goingUsers: User[];
  currentUserId: number;
  /** false = solo ver (la junta es de un grupo del que no eres miembro). */
  canParticipate: boolean;
};

export function SharedExpensesPanel({ eventId, goingUsers, currentUserId, canParticipate }: SharedExpensesPanelProps) {
  const { summary, isLoading, actionError, add, remove } = useExpenses(eventId, goingUsers.length);
  const canAdd = canParticipate && goingUsers.length > 0;
  const defaultPayerId = goingUsers.some((u) => u.id === currentUserId) ? currentUserId : goingUsers[0]?.id;

  if (isLoading || !summary) return <SkeletonRows count={2} label="Cargando gastos…" />;

  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatMoney(summary.total)}</span>
          <span className={styles.statLabel}>gastado en total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatMoney(summary.per_person)}</span>
          <span className={styles.statLabel}>por persona ({summary.people_count})</span>
        </div>
      </div>

      {summary.settlements.length > 0 && (
        <section>
          <h3 className={styles.subheading}>Para quedar a mano</h3>
          <ul className={styles.list}>
            {summary.settlements.map(({ from_user, to_user, amount }) => {
              const involvesMe = from_user.id === currentUserId || to_user.id === currentUserId;
              return (
                <li
                  key={`${from_user.id}-${to_user.id}`}
                  className={[styles.row, styles.settlement, involvesMe && styles.highlight].filter(Boolean).join(" ")}
                >
                  <Avatar user={from_user} size={26} />
                  <span className={styles.name}>{from_user.username}</span>
                  <ArrowRight aria-label="le paga a" className={styles.arrow} />
                  <Avatar user={to_user} size={26} />
                  <span className={styles.name}>{to_user.username}</span>
                  <strong className={styles.amount}>{formatMoney(amount)}</strong>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className={styles.subheading}>Gastos</h3>
        {summary.expenses.length === 0 ? (
          <p className={styles.hint}>Todavía nadie ha anotado gastos.</p>
        ) : (
          <ul className={styles.list}>
            {summary.expenses.map((expense) => (
              <li key={expense.id} className={styles.row}>
                <span className={styles.expenseText}>
                  <strong>{expense.description}</strong>
                  <span>pagó {expense.paid_by.username}</span>
                </span>
                <strong className={styles.amount}>{formatMoney(expense.amount)}</strong>
                {expense.can_delete && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => remove(expense.id)}
                    aria-label={`Borrar ${expense.description}`}
                  >
                    <Trash2 aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canAdd ? (
        <ExpenseForm payers={goingUsers} defaultPayerId={defaultPayerId} onSubmit={add} />
      ) : (
        canParticipate && <p className={styles.hint}>Cuando alguien confirme asistencia podrán anotar gastos.</p>
      )}
      {actionError && <p className={styles.error}>{actionError}</p>}
    </div>
  );
}
