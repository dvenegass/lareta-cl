import { CalendarDays, ChevronLeft, ChevronRight, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import type { EventSummary } from "../../types";
import {
  addDays,
  formatDayHeading,
  formatMonthYear,
  formatTime,
  formatWeekday,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "../../utils/dates";
import { Card } from "../ui/Card";
import styles from "./WeekAgenda.module.css";

/** Semana con marcas en los días con juntas + lista de las juntas de esa semana. */
export function WeekAgenda({ events }: { events: EventSummary[] }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekEvents = events.filter((event) => {
    const date = new Date(event.starts_at);
    return date >= weekStart && date < addDays(weekStart, 7);
  });

  // Agrupadas por día, en orden.
  const groups = days
    .map((day) => ({ day, items: weekEvents.filter((e) => isSameDay(new Date(e.starts_at), day)) }))
    .filter((group) => group.items.length > 0);

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(today));

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Agenda</h2>
          <span className={styles.month}>{formatMonthYear(days[3])}</span>
        </div>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            disabled={isCurrentWeek}
            aria-label="Semana anterior"
          >
            <ChevronLeft aria-hidden />
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="Semana siguiente"
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
      </div>

      <ol className={styles.days}>
        {days.map((day) => {
          const hasEvents = weekEvents.some((e) => isSameDay(new Date(e.starts_at), day));
          const isPast = day < startOfDay(today);
          return (
            <li
              key={day.toISOString()}
              className={[styles.day, isSameDay(day, today) && styles.today, isPast && styles.past]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.weekday}>{formatWeekday(day)}</span>
              <span className={styles.number}>{day.getDate()}</span>
              <span className={[styles.dot, hasEvents && styles.hasEvents].filter(Boolean).join(" ")} />
            </li>
          );
        })}
      </ol>

      {groups.length === 0 ? (
        <p className={styles.empty}>
          <CalendarDays aria-hidden /> Sin juntas esta semana.
        </p>
      ) : (
        <div className={styles.list}>
          {groups.map(({ day, items }) => (
            <section key={day.toISOString()} className={styles.group}>
              <h3 className={styles.dayHeading}>{formatDayHeading(day)}</h3>
              {items.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className={styles.item}>
                  <span className={styles.itemIcon} aria-hidden>
                    {event.group ? <UsersRound /> : <CalendarDays />}
                  </span>
                  <span className={styles.itemText}>
                    <strong>{event.title}</strong>
                    <span>
                      {formatTime(event.starts_at)} · {event.location}
                    </span>
                  </span>
                </Link>
              ))}
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}
