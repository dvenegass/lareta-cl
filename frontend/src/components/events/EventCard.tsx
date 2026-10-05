import { Users } from "lucide-react";
import { Link } from "react-router";

import type { EventSummary } from "../../types";
import { dateBadge } from "../../utils/dates";
import { AttendanceBadge } from "./AttendanceBadge";
import { EventMeta } from "./EventMeta";
import styles from "./EventCard.module.css";
import { GroupChip } from "./GroupChip";

export function EventCard({ event }: { event: EventSummary }) {
  const { day, month } = dateBadge(event.starts_at);

  return (
    <Link
      to={`/events/${event.id}`}
      className={[styles.card, event.is_cancelled && styles.cancelled].filter(Boolean).join(" ")}
    >
      <div className={styles.top}>
        <div className={styles.date}>
          <span className={styles.day}>{day}</span>
          <span className={styles.month}>{month}</span>
        </div>
        <div className={styles.heading}>
          <h3 className={styles.title}>{event.title}</h3>
          <p className={styles.creator}>por {event.creator.username}</p>
        </div>
      </div>

      {event.group && <GroupChip group={event.group} />}

      <EventMeta startsAt={event.starts_at} location={event.location} showDate={false} />

      <div className={styles.footer}>
        <span className={styles.going}>
          <Users aria-hidden />
          {event.going_count} {event.going_count === 1 ? "va" : "van"}
        </span>
        <AttendanceBadge status={event.my_status} cancelled={event.is_cancelled} />
      </div>
    </Link>
  );
}
