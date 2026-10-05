import { listEvents } from "../api/events";
import type { EventListScope } from "../types";
import { useFetch } from "./useFetch";

export function useEvents(scope: EventListScope) {
  const { data, isLoading, error } = useFetch(() => listEvents(scope), [scope]);
  return { events: data ?? [], isLoading, error };
}
