import { Receipt, Wallet } from "lucide-react";

import type { EventDetail } from "../../types";
import { Card } from "../ui/Card";
import { FixedFeePanel } from "./FixedFeePanel";
import styles from "./MoneyPanels.module.css";
import { SharedExpensesPanel } from "./SharedExpensesPanel";

type MoneySectionProps = {
  event: EventDetail;
  currentUserId: number;
  onTogglePaid: (userId: number, paid: boolean) => void;
  disabled?: boolean;
};

/** La plata de la junta, según el tipo elegido al crearla. */
export function MoneySection({ event, currentUserId, onTogglePaid, disabled }: MoneySectionProps) {
  if (event.money_mode === "none") return null;

  const going = event.participants.filter((p) => p.status === "going");
  const isFixed = event.money_mode === "fixed";

  return (
    <Card className={styles.section}>
      <h2 className={styles.title}>
        {isFixed ? <Wallet aria-hidden /> : <Receipt aria-hidden />}
        {isFixed ? "Cuota" : "Gastos compartidos"}
      </h2>

      {isFixed ? (
        <FixedFeePanel
          feeAmount={event.fee_amount ?? 0}
          going={going}
          onTogglePaid={event.is_creator ? onTogglePaid : undefined}
          disabled={disabled}
        />
      ) : (
        <SharedExpensesPanel
          eventId={event.id}
          goingUsers={going.map((p) => p.user)}
          currentUserId={currentUserId}
          canParticipate={event.can_join}
        />
      )}
    </Card>
  );
}
