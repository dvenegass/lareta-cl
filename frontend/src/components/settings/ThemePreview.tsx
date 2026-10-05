import { AttendanceBadge } from "../events/AttendanceBadge";
import { Button } from "../ui/Button";
import styles from "./ThemePreview.module.css";

const ACCENTS = [1, 2, 3, 4, 5];

/** Muestra de la paleta generada: botones, estados y acentos. */
export function ThemePreview() {
  return (
    <div className={styles.preview} aria-hidden>
      <div className={styles.accents}>
        {ACCENTS.map((n) => (
          <span key={n} className={styles.accent} style={{ background: `var(--accent-${n})` }} />
        ))}
      </div>
      <div className={styles.row}>
        <Button tabIndex={-1}>Principal</Button>
        <Button variant="secondary" tabIndex={-1}>
          Secundario
        </Button>
      </div>
      <div className={styles.row}>
        <AttendanceBadge status="going" />
        <AttendanceBadge status="not_going" />
        <AttendanceBadge status={null} />
      </div>
    </div>
  );
}
