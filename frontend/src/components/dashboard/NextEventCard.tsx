import { ArrowRight, CalendarHeart, Clock, MapPin, Plus, Users } from "lucide-react";

import type { EventSummary } from "../../types";
import { dateBadge, formatDate, formatTime, relativeDay } from "../../utils/dates";
import { AttendanceBadge } from "../events/AttendanceBadge";
import { GroupChip } from "../events/GroupChip";
import { ButtonLink } from "../ui/Button";
import { Card } from "../ui/Card";
import styles from "./NextEventCard.module.css";

/** La próxima junta, destacada. Sin juntas, invita a crear una. */
export function NextEventCard({ event }: { event: EventSummary | null }) {
  if (!event) {
    return (
      <Card className={[styles.card, styles.empty].join(" ")}>
        <span className={styles.emptyIcon} aria-hidden>
          <CalendarHeart />
        </span>
        <div>
          <h2 className={styles.emptyTitle}>No tienes juntas próximas</h2>
          <p className={styles.muted}>Crea una, o únete a un grupo: sus juntas aparecerán aquí.</p>
        </div>
        <ButtonLink to="/events/new" icon={<Plus />}>
          Nueva junta
        </ButtonLink>
      </Card>
    );
  }

  const { day, month } = dateBadge(event.starts_at);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Tu próxima junta</span>
        <span className={styles.countdown}>{relativeDay(event.starts_at)}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.date} aria-hidden>
          <span className={styles.day}>{day}</span>
          <span className={styles.month}>{month}</span>
        </div>
        <div className={styles.info}>
          {event.group && <GroupChip group={event.group} />}
          <h2 className={styles.title}>{event.title}</h2>
          <ul className={styles.meta}>
            <li className={styles.capitalize}>{formatDate(event.starts_at)}</li>
            <li>
              <Clock aria-hidden /> {formatTime(event.starts_at)}
            </li>
            <li>
              <MapPin aria-hidden /> {event.location}
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.going}>
          <Users aria-hidden />
          {event.going_count} {event.going_count === 1 ? "confirmado" : "confirmados"}
        </span>
        <AttendanceBadge status={event.my_status} />
        <ButtonLink to={`/events/${event.id}`} variant="secondary" className={styles.open}>
          Ver junta <ArrowRight aria-hidden />
        </ButtonLink>
      </div>
    </Card>
  );
}
