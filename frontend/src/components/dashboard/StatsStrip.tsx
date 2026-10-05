import type { LucideIcon } from "lucide-react";

import { Card } from "../ui/Card";
import styles from "./StatsStrip.module.css";

export type Stat = {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  /** "attention" resalta el dato (p. ej. juntas sin responder). */
  tone?: "neutral" | "attention" | "positive";
};

/** Fila de cifras clave, separadas por divisores (estilo panel). */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <Card className={styles.strip}>
      {stats.map(({ label, value, hint, icon: Icon, tone = "neutral" }) => (
        <div key={label} className={styles.stat}>
          <div className={styles.labelRow}>
            <span className={styles.icon} aria-hidden>
              <Icon />
            </span>
            {label}
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{value}</span>
            <span className={[styles.hint, styles[tone]].join(" ")}>{hint}</span>
          </div>
        </div>
      ))}
    </Card>
  );
}
