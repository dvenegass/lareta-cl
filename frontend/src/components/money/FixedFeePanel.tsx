import { Check, Clock } from "lucide-react";

import type { Participant } from "../../types";
import { formatMoney } from "../../utils/money";
import { Avatar } from "../ui/Avatar";
import styles from "./MoneyPanels.module.css";

type FixedFeePanelProps = {
  feeAmount: number;
  going: Participant[];
  /** Si se pasa, el organizador puede marcar quién pagó. */
  onTogglePaid?: (userId: number, paid: boolean) => void;
  disabled?: boolean;
};

export function FixedFeePanel({ feeAmount, going, onTogglePaid, disabled }: FixedFeePanelProps) {
  const paidCount = going.filter((p) => p.fee_paid).length;

  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatMoney(feeAmount)}</span>
          <span className={styles.statLabel}>por persona</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatMoney(paidCount * feeAmount)}</span>
          <span className={styles.statLabel}>
            juntado de {formatMoney(going.length * feeAmount)} ({paidCount}/{going.length})
          </span>
        </div>
      </div>

      {onTogglePaid && <p className={styles.hint}>Toca a cada persona cuando te pague.</p>}

      <ul className={styles.list}>
        {going.map(({ user, fee_paid }) => {
          const content = (
            <>
              <Avatar user={user} size={30} />
              <span className={styles.name}>{user.username}</span>
              <span className={fee_paid ? styles.paid : styles.pending}>
                {fee_paid ? <Check aria-hidden /> : <Clock aria-hidden />}
                {fee_paid ? "Pagó" : "Pendiente"}
              </span>
            </>
          );
          return (
            <li key={user.id}>
              {onTogglePaid ? (
                <button
                  type="button"
                  className={[styles.row, styles.rowButton].join(" ")}
                  onClick={() => onTogglePaid(user.id, !fee_paid)}
                  aria-pressed={fee_paid}
                  disabled={disabled}
                >
                  {content}
                </button>
              ) : (
                <div className={styles.row}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
