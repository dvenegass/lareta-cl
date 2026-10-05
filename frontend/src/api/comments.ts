import type { EventComment } from "../types";
import { request } from "./client";

export const listComments = (eventId: string) => request<EventComment[]>(`/events/${eventId}/comments/`);

export const addComment = (eventId: string, body: string) =>
  request<EventComment>(`/events/${eventId}/comments/`, { method: "POST", body: { body } });

export const deleteComment = (commentId: number) =>
  request<void>(`/comments/${commentId}/`, { method: "DELETE" });
