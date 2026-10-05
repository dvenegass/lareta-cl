import { CalendarHeart } from "lucide-react";

import type { EventSummary } from "../../types";
import { EventRow } from "../dashboard/EventRow";
import { Card } from "../ui/Card";
import { SkeletonRows } from "../ui/Skeleton";
import styles from "./GroupEventsCard.module.css";

type GroupEventsCardProps = {
  events: EventSummary[];
  isLoading: boolean;
  hasError: boolean;
};

/** Próximas juntas del grupo, en filas compactas (para la columna lateral). */
export function GroupEventsCard({ events, isLoading, hasError }: GroupEventsCardProps) {
  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>
        Próximas juntas {!isLoading && <span className={styles.count}>{events.length}</span>}
      </h2>

      {isLoading ? (
        <SkeletonRows count={2} label="Cargando juntas…" />
      ) : hasError ? (
        <p className={styles.hint}>No pudimos cargar las juntas.</p>
      ) : events.length === 0 ? (
        <div className={styles.empty}>
          <CalendarHeart aria-hidden />
          <p>Este grupo no tiene juntas próximas.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {events.map((event) => (
            <EventRow key={event.id} event={event} compact />
          ))}
        </ul>
      )}
    </Card>
  );
}
