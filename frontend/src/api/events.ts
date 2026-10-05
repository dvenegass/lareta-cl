import type {
  AttendanceStatus,
  EventDetail,
  EventInput,
  EventListScope,
  EventSummary,
  HistoryEvent,
  ParticipantUpdate,
} from "../types";
import { request } from "./client";

export const listEvents = (scope: EventListScope) => request<EventSummary[]>(`/events/?scope=${scope}`);

/** Juntas pasadas (las más recientes primero), con datos de su álbum. */
export const listPastEvents = () => request<HistoryEvent[]>("/events/?scope=past");

/** Próximas juntas de un grupo (solo para sus miembros). */
export const listGroupEvents = (groupId: number) => request<EventSummary[]>(`/events/?group=${groupId}`);

export const getEvent = (id: string) => request<EventDetail>(`/events/${id}/`);

export const createEvent = (data: EventInput) =>
  request<EventDetail>("/events/", { method: "POST", body: data });

export const updateEvent = (id: string, data: EventInput) =>
  request<EventDetail>(`/events/${id}/`, { method: "PUT", body: data });

export const deleteEvent = (id: string) => request<void>(`/events/${id}/`, { method: "DELETE" });

/** Solo el organizador: cancelar (con motivo opcional) o reactivar la junta. */
export const cancelEvent = (id: string, reason: string) =>
  request<EventDetail>(`/events/${id}/cancel/`, { method: "POST", body: { reason } });

export const reactivateEvent = (id: string) => request<EventDetail>(`/events/${id}/cancel/`, { method: "DELETE" });

export const setAttendance =(id: string, status: AttendanceStatus) =>
  request<EventDetail>(`/events/${id}/attendance/`, { method: "PUT", body: { status } });

/** Solo el organizador: marcar llegada o cuota pagada de un participante. */
export const updateParticipant = (id: string, userId: number, data: ParticipantUpdate) =>
  request<EventDetail>(`/events/${id}/participants/${userId}/`, { method: "PATCH", body: data });
