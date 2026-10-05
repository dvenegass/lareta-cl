import { Check, Clock, X, type LucideIcon } from "lucide-react";

import type { Arrival } from "../../types";
import styles from "./ArrivalPicker.module.css";

export const ARRIVAL_LABELS: Record<Arrival, string> = {
  on_time: "A tiempo",
  late: "Tarde",
  absent: "No llegó",
};

const ICONS: Record<Arrival, LucideIcon> = { on_time: Check, late: Clock, absent: X };
const ARRIVALS: Arrival[] = ["on_time", "late", "absent"];

type ArrivalPickerProps = {
  value: Arrival | null;
  onChange: (arrival: Arrival | null) => void;
  disabled?: boolean;
};

/** Para el organizador: marcar cómo llegó alguien. Pulsar la opción activa la desmarca. */
export function ArrivalPicker({ value, onChange, disabled }: ArrivalPickerProps) {
  return (
    <div className={styles.group} role="group" aria-label="Llegada">
      {ARRIVALS.map((arrival) => {
        const Icon = ICONS[arrival];
        const isActive = value === arrival;
        return (
          <button
            key={arrival}
            type="button"
            className={[styles.option, styles[arrival], isActive && styles.active].filter(Boolean).join(" ")}
            onClick={() => onChange(isActive ? null : arrival)}
            aria-pressed={isActive}
            title={ARRIVAL_LABELS[arrival]}
            disabled={disabled}
          >
            <Icon aria-hidden />
            <span className={styles.label}>{ARRIVAL_LABELS[arrival]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Lo que ven los demás: cómo llegó la persona, si ya se marcó. */
export function ArrivalBadge({ arrival }: { arrival: Arrival }) {
  const Icon = ICONS[arrival];
  return (
    <span className={[styles.badge, styles[arrival]].join(" ")}>
      <Icon aria-hidden />
      {ARRIVAL_LABELS[arrival]}
    </span>
  );
}
