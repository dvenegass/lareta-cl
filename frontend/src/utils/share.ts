import type { EventSummary } from "../types";
import { formatDate, formatTime } from "./dates";

/**
 * Enlace para compartir una junta. Lo sirve Django con la vista previa
 * (título, fecha e imagen) que usan WhatsApp, Telegram, Discord, etc.,
 * y redirige a la junta.
 */
export function eventShareUrl(eventId: string) {
  return `${window.location.origin}/share/events/${eventId}/`;
}

/** Mensaje listo para WhatsApp: nombre, cuándo, dónde y el enlace. */
export function eventShareMessage(event: Pick<EventSummary, "id" | "title" | "starts_at" | "location">) {
  const day = formatDate(event.starts_at);
  const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
  return [
    `*${event.title}*`,
    `${capitalizedDay}, ${formatTime(event.starts_at)}`,
    event.location,
    "",
    `¿Vienes? Confirma aquí: ${eventShareUrl(event.id)}`,
  ].join("\n");
}

/** Abre WhatsApp (app o web) con el mensaje ya escrito; tú eliges el chat. */
export function whatsappShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
