import { ChevronRight, Users } from "lucide-react";
import { Link } from "react-router";

import type { EventSummary } from "../../types";
import { dateBadge, formatTime } from "../../utils/dates";
import { AttendanceBadge } from "../events/AttendanceBadge";
import { GroupChip } from "../events/GroupChip";
import styles from "./EventRow.module.css";

type EventRowProps = {
  event: EventSummary;
  /** Para columnas angostas: sin grupo, confirmados ni flecha. */
  compact?: boolean;
};

/** Una junta como fila de lista (más compacta que la tarjeta). */
export function EventRow({ event, compact = false }: EventRowProps) {
  const { day, month } = dateBadge(event.starts_at);

  return (
    <li>
      <Link
        to={`/events/${event.id}`}
        className={[styles.row, compact && styles.compact, event.is_cancelled && styles.cancelled]
          .filter(Boolean)
          .join(" ")}
      >
        <span className={styles.date} aria-hidden>
          <strong>{day}</strong>
          {month}
        </span>
        <span className={styles.main}>
          <span className={styles.titleLine}>
            <strong className={styles.title}>{event.title}</strong>
            {event.group && !compact && <GroupChip group={event.group} />}
          </span>
          <span className={styles.meta}>
            {formatTime(event.starts_at)} · {event.location}
          </span>
        </span>
        <span className={styles.going} title="Confirmados">
          <Users aria-hidden />
          {event.going_count}
        </span>
        <span className={styles.status}>
          <AttendanceBadge status={event.my_status} cancelled={event.is_cancelled} />
        </span>
        <ChevronRight aria-hidden className={styles.chevron} />
      </Link>
    </li>
  );
}
