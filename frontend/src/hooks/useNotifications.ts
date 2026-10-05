import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";

import * as notificationsApi from "../api/notifications";
import type { AppNotification } from "../types";

// Cada cuánto se revisa si hay avisos nuevos (además de al cambiar de página).
const POLL_MS = 60_000;

/** Contador de no leídas (se actualiza solo) + la lista, que se carga al abrir el panel. */
export function useNotifications() {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCount = useCallback(() => {
    notificationsApi
      .getUnreadCount()
      .then((data) => setUnreadCount(data.unread_count))
      .catch(() => {}); // si falla, se reintenta en la próxima vuelta
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = window.setInterval(refreshCount, POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshCount, pathname]);

  async function loadList() {
    setIsLoading(true);
    try {
      const data = await notificationsApi.listNotifications();
      setItems(data.results);
      setUnreadCount(data.unread_count);
    } finally {
      setIsLoading(false);
    }
  }

  async function markRead(notification: AppNotification) {
    if (notification.is_read) return;
    setItems((current) => current?.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)) ?? null);
    setUnreadCount((count) => Math.max(0, count - 1));
    await notificationsApi.markNotificationRead(notification.id).catch(() => {});
  }

  async function markAllRead() {
    setItems((current) => current?.map((n) => ({ ...n, is_read: true })) ?? null);
    setUnreadCount(0);
    await notificationsApi.markAllNotificationsRead().catch(() => {});
  }

  return { unreadCount, items, isLoading, loadList, markRead, markAllRead };
}
