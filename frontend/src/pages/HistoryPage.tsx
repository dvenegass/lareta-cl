import { Camera, History, Images, MapPin, Users } from "lucide-react";
import { Link } from "react-router";

import { listPastEvents } from "../api/events";
import { PageHeader } from "../components/layout/PageHeader";
import { SkeletonCards } from "../components/ui/Skeleton";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useFetch } from "../hooks/useFetch";
import type { HistoryEvent } from "../types";
import { dateBadge, formatDate, formatMonthYear } from "../utils/dates";
import styles from "./HistoryPage.module.css";

/** Agrupa las juntas por mes ("octubre de 2026"), manteniendo el orden (más recientes primero). */
function byMonth(events: HistoryEvent[]) {
  const months = new Map<string, HistoryEvent[]>();
  for (const event of events) {
    const month = formatMonthYear(new Date(event.starts_at));
    months.set(month, [...(months.get(month) ?? []), event]);
  }
  return [...months.entries()];
}

function HistoryCard({ event }: { event: HistoryEvent }) {
  const { day, month } = dateBadge(event.starts_at);

  return (
    <Link to={`/events/${event.id}`} className={styles.card}>
      <div className={styles.cover}>
        {event.cover_image ? (
          <img src={event.cover_image} alt="" loading="lazy" />
        ) : (
          <span className={styles.placeholder} aria-hidden>
            <strong>{day}</strong>
            {month}
          </span>
        )}
        {event.photo_count > 0 && (
          <span className={styles.photoCount}>
            <Images aria-hidden /> {event.photo_count}
          </span>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{event.title}</h3>
        <p className={styles.date}>{formatDate(event.starts_at)}</p>
        <p className={styles.meta}>
          <MapPin aria-hidden /> {event.location}
        </p>
        <p className={styles.meta}>
          <Users aria-hidden /> {event.going_count} {event.going_count === 1 ? "fue" : "fueron"}
          {event.photo_count === 0 && (
            <span className={styles.noPhotos}>
              <Camera aria-hidden /> Sin fotos
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function HistoryPage() {
  const { data: events, isLoading, error } = useFetch(listPastEvents, []);

  return (
    <>
      <PageHeader title="Historial" subtitle="Tus juntas pasadas y sus fotos." />

      {isLoading ? (
        <SkeletonCards count={3} label="Cargando historial…" />
      ) : error || !events ? (
        <StatusMessage tone="error" title="No pudimos cargar tu historial." />
      ) : events.length === 0 ? (
        <StatusMessage icon={<History />} title="Todavía no tienes juntas pasadas">
          <p>Cuando pase tu primera junta aparecerá aquí, con su álbum de fotos.</p>
        </StatusMessage>
      ) : (
        <div className={styles.months}>
          {byMonth(events).map(([month, monthEvents]) => (
            <section key={month} className={styles.month}>
              <h2 className={styles.monthTitle}>{month}</h2>
              <div className={styles.grid}>
                {monthEvents.map((event) => (
                  <HistoryCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
