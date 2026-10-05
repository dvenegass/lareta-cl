import type { FriendRequests, User, UserSearchResult } from "../types";
import { request } from "./client";

export const listFriends = () => request<User[]>("/friends/");

export const removeFriend = (userId: number) => request<void>(`/friends/${userId}/`, { method: "DELETE" });

export const listFriendRequests = () => request<FriendRequests>("/friends/requests/");

export const sendFriendRequest = (username: string) =>
  request<{ status: "pending" | "accepted" }>("/friends/requests/", { method: "POST", body: { username } });

export const acceptFriendRequest = (requestId: number) =>
  request<void>(`/friends/requests/${requestId}/accept/`, { method: "POST" });

/** Rechazar (si me la enviaron) o cancelar (si la envié yo). */
export const deleteFriendRequest = (requestId: number) =>
  request<void>(`/friends/requests/${requestId}/`, { method: "DELETE" });

export const searchUsers = (query: string) =>
  request<UserSearchResult[]>(`/friends/search/?q=${encodeURIComponent(query)}`);
