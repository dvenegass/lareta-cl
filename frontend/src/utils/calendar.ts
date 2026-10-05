// Agregar una junta al calendario (Google Calendar o archivo .ics).

import type { EventSummary } from "../types";

type CalendarEvent = Pick<EventSummary, "id" | "title" | "starts_at" | "location"> & { description?: string };

// La junta no tiene hora de término: se asume esta duración.
const DEFAULT_DURATION_HOURS = 3;

/** 2026-10-14T23:00:00Z → "20261014T230000Z" (formato de calendario, en UTC). */
function toCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function range(startsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  return { start: toCalendarDate(start), end: toCalendarDate(end) };
}

function eventUrl(eventId: string) {
  return `${window.location.origin}/events/${eventId}`;
}

export function googleCalendarUrl(event: CalendarEvent) {
  const { start, end } = range(event.starts_at);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    location: event.location,
    details: [event.description, `Junta en lareta.cl: ${eventUrl(event.id)}`].filter(Boolean).join("\n\n"),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Escapa texto para .ics (comas, punto y coma, saltos de línea). */
function icsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Descarga un .ics: sirve para el calendario del iPhone, Outlook, etc. */
export function downloadIcs(event: CalendarEvent) {
  const { start, end } = range(event.starts_at);
  const description = [event.description, `Junta en lareta.cl: ${eventUrl(event.id)}`].filter(Boolean).join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//lareta.cl//Juntas//ES",
    "BEGIN:VEVENT",
    `UID:${event.id}@lareta.cl`,
    `DTSTAMP:${toCalendarDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsText(event.title)}`,
    `LOCATION:${icsText(event.location)}`,
    `DESCRIPTION:${icsText(description)}`,
    `URL:${eventUrl(event.id)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^\w\- ]+/g, "").trim() || "junta"}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Abre el lugar en Google Maps (busca el texto tal como lo escribieron). */
export function googleMapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function wazeUrl(location: string) {
  return `https://waze.com/ul?q=${encodeURIComponent(location)}&navigate=yes`;
}
