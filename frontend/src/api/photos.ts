import type { EventPhoto } from "../types";
import { request } from "./client";

export const listPhotos = (eventId: string) => request<EventPhoto[]>(`/events/${eventId}/photos/`);

export function uploadPhoto(eventId: string, image: File) {
  const data = new FormData();
  data.append("image", image);
  return request<EventPhoto>(`/events/${eventId}/photos/`, { method: "POST", body: data });
}

export const deletePhoto = (photoId: number) => request<void>(`/photos/${photoId}/`, { method: "DELETE" });
