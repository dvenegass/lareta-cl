import type { AppNotification } from "../types";
import { request } from "./client";

export const listNotifications = () =>
  request<{ unread_count: number; results: AppNotification[] }>("/notifications/");

export const getUnreadCount = () => request<{ unread_count: number }>("/notifications/unread-count/");

export const markNotificationRead = (id: number) =>
  request<void>(`/notifications/${id}/read/`, { method: "POST" });

export const markAllNotificationsRead = () => request<void>("/notifications/read-all/", { method: "POST" });
