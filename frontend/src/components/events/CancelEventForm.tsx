import { CalendarX } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "../ui/Button";
import { TextArea } from "../ui/TextField";
import styles from "./CancelEventForm.module.css";

type CancelEventFormProps = {
  /** Cuántas personas confirmaron (para avisar a quiénes les llegará la notificación). */
  goingCount: number;
  onConfirm: (reason: string) => void;
  onBack: () => void;
  disabled?: boolean;
};

/** Confirmación para cancelar una junta, con un motivo opcional. */
export function CancelEventForm({ goingCount, onConfirm, onBack, disabled }: CancelEventFormProps) {
  const [reason, setReason] = useState("");
  const others = Math.max(goingCount - 1, 0); // sin contar al organizador

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onConfirm(reason.trim());
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.lead}>
        <strong>¿Cancelar la junta?</strong> Seguirá visible, pero nadie podrá confirmar ni participar.
        {others === 1 && " Le avisaremos a la persona que iba."}
        {others > 1 && ` Les avisaremos a las ${others} personas que iban.`}
        {" "}Puedes reactivarla después.
      </p>
      <TextArea
        label="Motivo (opcional)"
        placeholder="Se largó a llover, mejor la otra semana…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={200}
        autoFocus
      />
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onBack} disabled={disabled}>
          Volver
        </Button>
        <Button type="submit" variant="danger" icon={<CalendarX />} disabled={disabled}>
          Cancelar junta
        </Button>
      </div>
    </form>
  );
}
