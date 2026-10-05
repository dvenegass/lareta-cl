import { CalendarDays, ChevronDown, Palette } from "lucide-react";
import { Link } from "react-router";

import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/dates";
import { Avatar } from "../ui/Avatar";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import styles from "./Topbar.module.css";

/**
 * Barra superior del área de contenido: fecha de hoy, notificaciones, apariencia y tu usuario.
 * En móvil (sin barra lateral) muestra el logo en vez de la fecha.
 */
export function Topbar() {
  const { user } = useAuth();
  const today = formatDate(new Date().toISOString());

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <span className={styles.desktopOnly}>
          <span className={styles.today}>
            <CalendarDays aria-hidden />
            <span className={styles.capitalize}>{today}</span>
          </span>
        </span>
        <span className={styles.mobileOnly}>
          <Logo to="/dashboard" />
        </span>
      </div>

      <div className={styles.actions}>
        <NotificationBell />
        <Link to="/settings/appearance" className={styles.iconButton} aria-label="Apariencia" title="Apariencia">
          <Palette aria-hidden />
        </Link>

        {user && (
          <>
            <span className={[styles.divider, styles.desktopOnly].join(" ")} aria-hidden />
            <Link to="/profile" className={styles.user} aria-label="Mi perfil">
              <Avatar user={user} size={36} />
              <span className={[styles.userName, styles.desktopOnly].join(" ")}>{user.username}</span>
              <ChevronDown aria-hidden className={[styles.chevron, styles.desktopOnly].join(" ")} />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
