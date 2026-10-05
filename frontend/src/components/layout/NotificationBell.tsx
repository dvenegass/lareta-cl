import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  CheckCheck,
  PencilLine,
  UserCheck,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { useNotifications } from "../../hooks/useNotifications";
import type { AppNotification, NotificationKind, NotificationTarget } from "../../types";
import { timeAgo } from "../../utils/dates";
import { SkeletonRows } from "../ui/Skeleton";
import styles from "./NotificationBell.module.css";

const ICONS: Record<NotificationKind, LucideIcon> = {
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  group_added: UsersRound,
  group_event: CalendarPlus,
  event_changed: PencilLine,
  event_reminder: CalendarClock,
  event_cancelled: CalendarX,
  event_reactivated: CalendarCheck,
};

function targetPath(target: NotificationTarget | null) {
  if (!target) return null;
  switch (target.type) {
    case "friends":
      return "/friends";
    case "user":
      return `/users/${encodeURIComponent(target.username)}`;
    case "group":
      return `/groups/${target.id}`;
    case "event":
      return `/events/${target.id}`;
  }
}

/** Campana de la barra superior: contador de no leídas y panel con los avisos. */
export function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount, items, isLoading, loadList, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  function toggle() {
    if (!isOpen) loadList();
    setIsOpen(!isOpen);
  }

  function open(notification: AppNotification) {
    markRead(notification);
    setIsOpen(false);
    const path = targetPath(notification.target);
    if (path) navigate(path);
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.bell}
        onClick={toggle}
        aria-label={unreadCount ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"}
        aria-expanded={isOpen}
        title="Notificaciones"
      >
        <Bell aria-hidden />
        {unreadCount > 0 && <span className={styles.count}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.panel} role="dialog" aria-label="Notificaciones">
          <div className={styles.header}>
            <h2 className={styles.title}>Notificaciones</h2>
            {unreadCount > 0 && (
              <button type="button" className={styles.readAll} onClick={markAllRead}>
                <CheckCheck aria-hidden /> Marcar todas como leídas
              </button>
            )}
          </div>

          {isLoading && !items ? (
            <div className={styles.skeleton}>
              <SkeletonRows count={3} label="Cargando avisos…" />
            </div>
          ) : !items || items.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden>
                <Bell />
              </span>
              <p>No tienes notificaciones todavía.</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {items.map((notification) => {
                const Icon = ICONS[notification.kind] ?? Bell;
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={[styles.item, !notification.is_read && styles.unread].filter(Boolean).join(" ")}
                      onClick={() => open(notification)}
                    >
                      <span className={styles.itemIcon} aria-hidden>
                        <Icon />
                      </span>
                      <span className={styles.itemText}>
                        <span>{notification.text}</span>
                        <span className={styles.time}>{timeAgo(notification.created_at)}</span>
                      </span>
                      {!notification.is_read && <span className={styles.dot} aria-label="Sin leer" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
