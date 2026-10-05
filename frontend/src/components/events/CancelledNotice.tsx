import { CalendarX, RotateCcw } from "lucide-react";

import { timeAgo } from "../../utils/dates";
import { Button } from "../ui/Button";
import styles from "./CancelledNotice.module.css";

type CancelledNoticeProps = {
  cancelledAt: string;
  reason: string;
  /** Solo el organizador puede reactivarla. */
  onReactivate?: () => void;
  disabled?: boolean;
};

/** Aviso destacado arriba de una junta cancelada. */
export function CancelledNotice({ cancelledAt, reason, onReactivate, disabled }: CancelledNoticeProps) {
  return (
    <div className={styles.notice} role="status">
      <CalendarX aria-hidden className={styles.icon} />
      <div className={styles.text}>
        <strong>Esta junta fue cancelada</strong>
        {reason && <p className={styles.reason}>«{reason}»</p>}
        <span className={styles.when}>Se canceló {timeAgo(cancelledAt)}</span>
      </div>
      {onReactivate && (
        <Button variant="secondary" icon={<RotateCcw />} onClick={onReactivate} disabled={disabled}>
          Reactivar
        </Button>
      )}
    </div>
  );
}
