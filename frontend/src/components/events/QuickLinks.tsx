import { CalendarPlus, Download, MapPin, Navigation } from "lucide-react";

import type { EventDetail } from "../../types";
import { downloadIcs, googleCalendarUrl, googleMapsUrl, wazeUrl } from "../../utils/calendar";
import styles from "./QuickLinks.module.css";

/** Cómo llegar (Maps / Waze) y agregar al calendario (Google / .ics). */
export function QuickLinks({ event }: { event: EventDetail }) {
  return (
    <div className={styles.groups}>
      <div className={styles.group}>
        <span className={styles.label}>Cómo llegar</span>
        <div className={styles.links}>
          <a className={styles.link} href={googleMapsUrl(event.location)} target="_blank" rel="noopener noreferrer">
            <MapPin aria-hidden /> Google Maps
          </a>
          <a className={styles.link} href={wazeUrl(event.location)} target="_blank" rel="noopener noreferrer">
            <Navigation aria-hidden /> Waze
          </a>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Agregar al calendario</span>
        <div className={styles.links}>
          <a className={styles.link} href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            <CalendarPlus aria-hidden /> Google Calendar
          </a>
          <button type="button" className={styles.link} onClick={() => downloadIcs(event)}>
            <Download aria-hidden /> iPhone / Outlook (.ics)
          </button>
        </div>
      </div>
    </div>
  );
}
