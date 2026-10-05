// Conversión entre el ISO del backend y lo que muestran/usan los formularios.

const dateFormatter = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" });
const timeFormatter = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });
const monthFormatter = new Intl.DateTimeFormat("es", { month: "short" });

/** "sábado, 25 de octubre" */
export const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

/** "20:00" */
export const formatTime = (iso: string) => timeFormatter.format(new Date(iso));

/** { day: "25", month: "oct" } para la etiqueta de las tarjetas. */
export function dateBadge(iso: string) {
  const date = new Date(iso);
  return { day: String(date.getDate()), month: monthFormatter.format(date).replace(".", "") };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-25" en hora local, para <input type="date">. */
export function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "20:00" en hora local, para <input type="time">. */
export function toTimeInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Junta fecha + hora locales en un ISO con zona horaria para el backend. */
export function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

// ---------- Calendario (agenda semanal del inicio) ----------

const DAY_MS = 24 * 60 * 60 * 1000;
const weekdayFormatter = new Intl.DateTimeFormat("es", { weekday: "short" });
const monthYearFormatter = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });
const dayHeadingFormatter = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "short" });

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Lunes de la semana de `date`. */
export function startOfWeek(date: Date) {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7; // lunes = 0
  return addDays(day, -offset);
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** "lun", "mar"... */
export const formatWeekday = (date: Date) => weekdayFormatter.format(date).replace(".", "");

/** "octubre de 2026" */
export const formatMonthYear = (date: Date) => monthYearFormatter.format(date);

/** "Hoy", "Mañana" o "sábado, 25 oct" para agrupar la agenda. */
export function formatDayHeading(date: Date) {
  const today = new Date();
  if (isSameDay(date, today)) return "Hoy";
  if (isSameDay(date, addDays(today, 1))) return "Mañana";
  return dayHeadingFormatter.format(date).replace(".", "");
}

/** "Hoy", "Ayer" o "sábado, 25 oct" para separar los mensajes del chat por día. */
export function formatChatDay(date: Date) {
  const today = new Date();
  if (isSameDay(date, today)) return "Hoy";
  if (isSameDay(date, addDays(today, -1))) return "Ayer";
  return dayHeadingFormatter.format(date).replace(".", "");
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 5 minutos", "hace 2 horas", "ayer"... para fechas pasadas. */
export function timeAgo(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (Math.abs(seconds) < 60) return "recién";
  if (Math.abs(minutes) < 60) return relativeTimeFormatter.format(minutes, "minute");
  if (Math.abs(hours) < 24) return relativeTimeFormatter.format(hours, "hour");
  return relativeTimeFormatter.format(days, "day");
}

/** "Hoy", "Mañana", "En 3 días" (o "Ya pasó"). */
export function relativeDay(iso: string) {
  const days = Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / DAY_MS);
  if (days < 0) return "Ya pasó";
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}
