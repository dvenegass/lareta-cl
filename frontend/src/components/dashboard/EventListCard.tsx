import { CalendarHeart, History, PenLine } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import type { EventSummary } from "../../types";
import { Card } from "../ui/Card";
import { SegmentedControl } from "../ui/SegmentedControl";
import { SkeletonRows } from "../ui/Skeleton";
import { StatusMessage } from "../ui/StatusMessage";
import { EventRow } from "./EventRow";
import styles from "./EventListCard.module.css";

type Tab = "upcoming" | "created";

type EventListCardProps = {
  upcoming: EventSummary[];
  created: EventSummary[];
  isLoading: boolean;
};

/** Lista de juntas con pestañas: próximas / creadas por mí. */
export function EventListCard({ upcoming, created, isLoading }: EventListCardProps) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const events = tab === "upcoming" ? upcoming : created;

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Juntas</h2>
        <div className={styles.tabs}>
          <SegmentedControl
            label="Qué juntas ver"
            value={tab}
            onChange={setTab}
            options={[
              { value: "upcoming", label: `Próximas (${upcoming.length})` },
              { value: "created", label: `Creadas por mí (${created.length})` },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonRows label="Cargando juntas…" />
      ) : events.length === 0 ? (
        tab === "upcoming" ? (
          <StatusMessage icon={<CalendarHeart />} title="No hay juntas próximas" />
        ) : (
          <StatusMessage icon={<PenLine />} title="Aún no has creado ninguna junta" />
        )
      ) : (
        <ul className={styles.list}>
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}

      <Link to="/history" className={styles.historyLink}>
        <History aria-hidden /> Ver juntas pasadas y fotos
      </Link>
    </Card>
  );
}
