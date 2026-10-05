import type { AttendanceStatus } from "../../types";
import styles from "./AttendanceBadge.module.css";

const LABELS: Record<AttendanceStatus | "none" | "cancelled", string> = {
  going: "Vas",
  not_going: "No vas",
  none: "Sin responder",
  cancelled: "Cancelada",
};

type AttendanceBadgeProps = {
  status: AttendanceStatus | null;
  /** Si la junta se canceló, eso es lo que importa: se muestra en vez de la respuesta. */
  cancelled?: boolean;
};

export function AttendanceBadge({ status, cancelled = false }: AttendanceBadgeProps) {
  const key = cancelled ? "cancelled" : (status ?? "none");
  return <span className={[styles.badge, styles[key]].join(" ")}>{LABELS[key]}</span>;
}
