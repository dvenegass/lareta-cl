import type { ChatDraft, ChatMessage, Gif } from "../types";
import { request } from "./client";

type ListParams = { after?: number; before?: number };

/** Sin parámetros: los últimos mensajes. `after`: los nuevos desde ese id. `before`: los anteriores. */
export function listMessages(groupId: number, { after, before }: ListParams = {}) {
  const query = after !== undefined ? `?after=${after}` : before !== undefined ? `?before=${before}` : "";
  return request<ChatMessage[]>(`/groups/${groupId}/messages/${query}`);
}

/** Con imagen se envía como multipart (FormData); si no, como JSON. */
export function sendMessage(groupId: number, { body, image, gif }: ChatDraft) {
  let payload: FormData | Record<string, unknown> = { body };
  if (image) {
    payload = new FormData();
    payload.append("body", body);
    payload.append("image", image);
  } else if (gif) {
    payload = { body, gif_url: gif.url, gif_width: gif.width, gif_height: gif.height };
  }
  return request<ChatMessage>(`/groups/${groupId}/messages/`, { method: "POST", body: payload });
}

export const deleteMessage = (messageId: number) =>
  request<void>(`/messages/${messageId}/`, { method: "DELETE" });

/** GIFs de KLIPY: con `query` busca; vacío trae los del momento. */
export function searchGifs(query: string, page = 1) {
  const params = new URLSearchParams({ q: query, page: String(page) });
  return request<{ results: Gif[]; has_next: boolean }>(`/gifs/?${params}`);
}

/** Dirección del WebSocket del chat (mismo host que la página; Vite lo reenvía a Django). */
export function chatSocketUrl(groupId: number) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws/groups/${groupId}/chat/`;
}
