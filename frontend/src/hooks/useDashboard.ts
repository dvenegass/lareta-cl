import { getMyStats } from "../api/stats";
import { addDays, startOfWeek } from "../utils/dates";
import { useEvents } from "./useEvents";
import { useFetch } from "./useFetch";

/** Datos del inicio: juntas, resumen en números y puntos. */
export function useDashboard() {
  const upcoming = useEvents("upcoming");
  const created = useEvents("created");
  const stats = useFetch(getMyStats, []);

  const now = new Date();
  const weekEnd = addDays(startOfWeek(now), 7);
  // Los números y "tu próxima junta" ignoran las canceladas (en la lista sí se ven, marcadas).
  const events = upcoming.events.filter((e) => !e.is_cancelled);

  const summary = {
    upcoming: events.length,
    thisWeek: events.filter((e) => new Date(e.starts_at) < weekEnd).length,
    going: events.filter((e) => e.my_status === "going").length,
    // Juntas (típicamente de mis grupos) a las que todavía no respondí.
    pending: events.filter((e) => e.my_status === null).length,
  };

  // La próxima que aún no empieza; si todas las de hoy ya empezaron, la primera.
  const nextEvent = events.find((e) => new Date(e.starts_at) >= now) ?? events[0] ?? null;

  return { upcoming, created, stats, summary, nextEvent };
}
