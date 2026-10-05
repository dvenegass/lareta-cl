import type { ReactNode } from "react";

import type { EventSummary } from "../../types";
import { SkeletonCards } from "../ui/Skeleton";
import { StatusMessage } from "../ui/StatusMessage";
import { EventCard } from "./EventCard";
import styles from "./EventGrid.module.css";

type EventGridProps = {
  events: EventSummary[];
  isLoading: boolean;
  hasError: boolean;
  empty: ReactNode;
};

/** Lista de tarjetas con sus estados de carga, error y vacío. */
export function EventGrid({ events, isLoading, hasError, empty }: EventGridProps) {
  if (isLoading) return <SkeletonCards label="Cargando juntas…" />;
  if (hasError) return <StatusMessage tone="error" title="No pudimos cargar las juntas." />;
  if (events.length === 0) return <>{empty}</>;

  return (
    <div className={styles.grid}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
