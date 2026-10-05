import { CalendarDays, Clock, MapPin } from "lucide-react";

import { formatDate, formatTime } from "../../utils/dates";
import styles from "./EventMeta.module.css";

type EventMetaProps = {
  startsAt: string;
  location: string;
  showDate?: boolean;
};

/** Fecha, hora y lugar con iconos. Se usa en tarjetas y en el detalle. */
export function EventMeta({ startsAt, location, showDate = true }: EventMetaProps) {
  return (
    <ul className={styles.list}>
      {showDate && (
        <li>
          <CalendarDays aria-hidden />
          <span className={styles.capitalize}>{formatDate(startsAt)}</span>
        </li>
      )}
      <li>
        <Clock aria-hidden />
        {formatTime(startsAt)}
      </li>
      <li>
        <MapPin aria-hidden />
        {location}
      </li>
    </ul>
  );
}
