import type { BringItem } from "../types";
import { request } from "./client";

// Todas devuelven la lista completa actualizada.

export const listItems = (eventId: string) => request<BringItem[]>(`/events/${eventId}/items/`);

export const addItem = (eventId: string, name: string) =>
  request<BringItem[]>(`/events/${eventId}/items/`, { method: "POST", body: { name } });

/** claim = true: "yo lo llevo"; false: lo suelto. */
export const setItemClaim = (itemId: number, claim: boolean) =>
  request<BringItem[]>(`/items/${itemId}/`, { method: "PATCH", body: { claim } });

export const deleteItem = (itemId: number) => request<BringItem[]>(`/items/${itemId}/`, { method: "DELETE" });
