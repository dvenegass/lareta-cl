import { Check, X } from "lucide-react";

import type { AttendanceStatus } from "../../types";
import styles from "./RsvpButtons.module.css";

const PROMPTS: Record<AttendanceStatus | "none", string> = {
  going: "¡Genial, vas a ir!",
  not_going: "Dijiste que no irás. Puedes cambiarlo cuando quieras.",
  none: "¿Vas a ir?",
};

type RsvpButtonsProps = {
  status: AttendanceStatus | null;
  onRespond: (status: AttendanceStatus) => void;
  disabled?: boolean;
};

export function RsvpButtons({ status, onRespond, disabled }: RsvpButtonsProps) {
  const option = (value: AttendanceStatus, label: string, Icon: typeof Check) => {
    const isActive = status === value;
    return (
      <button
        type="button"
        className={[styles.option, styles[value], isActive && styles.active].filter(Boolean).join(" ")}
        onClick={() => onRespond(value)}
        disabled={disabled || isActive}
        aria-pressed={isActive}
      >
        <Icon aria-hidden />
        {label}
      </button>
    );
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.prompt}>{PROMPTS[status ?? "none"]}</p>
      <div className={styles.options}>
        {option("going", "Asistiré", Check)}
        {option("not_going", "No asistiré", X)}
      </div>
    </div>
  );
}
