import { useState } from "react";

import { ApiError } from "../api/client";
import { cancelEvent, getEvent, reactivateEvent, setAttendance, updateParticipant } from "../api/events";
import type { AttendanceStatus, EventDetail, ParticipantUpdate } from "../types";
import { useFetch } from "./useFetch";

/** Una junta + las acciones que la modifican (responder, cancelar, marcar llegada o pago). */
export function useEvent(id: string) {
  const { data: event, setData: setEvent, isLoading, error } = useFetch(() => getEvent(id), [id]);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Ejecuta una acción; el backend devuelve la junta ya actualizada. */
  async function run(action: () => Promise<EventDetail>) {
    setIsSaving(true);
    setActionError(null);
    try {
      setEvent(await action());
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    event,
    isLoading,
    error,
    isSaving,
    actionError,
    respond: (status: AttendanceStatus) => run(() => setAttendance(id, status)),
    cancel: (reason: string) => run(() => cancelEvent(id, reason)),
    reactivate: () => run(() => reactivateEvent(id)),
    markParticipant: (userId: number, data: ParticipantUpdate) => run(() => updateParticipant(id, userId, data)),
  };
}
