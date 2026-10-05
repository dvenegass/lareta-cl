import { ChevronRight, Plus } from "lucide-react";
import { Link, NavLink } from "react-router";

import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../ui/Avatar";
import { ButtonLink } from "../ui/Button";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./navItems";
import styles from "./Sidebar.module.css";

/** Navegación principal en pantallas grandes. */
export function Sidebar({ pendingRequests }: { pendingRequests: number }) {
  const { user } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <Logo to="/dashboard" />
      </div>

      <nav className={styles.nav} aria-label="Principal">
        {NAV_ITEMS.map(({ to, label, icon: Icon, showsFriendRequests }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => [styles.item, isActive && styles.active].filter(Boolean).join(" ")}
          >
            <Icon aria-hidden />
            <span className={styles.label}>{label}</span>
            {showsFriendRequests && pendingRequests > 0 && (
              <span className={styles.badge} aria-label={`${pendingRequests} solicitudes`}>
                {pendingRequests}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <ButtonLink to="/events/new" variant="secondary" icon={<Plus />} fullWidth className={styles.cta}>
        Nueva junta
      </ButtonLink>

      {user && (
        <Link to="/profile" className={styles.userCard}>
          <Avatar user={user} size={40} />
          <span className={styles.userText}>
            <strong>{user.username}</strong>
            <span>Ver perfil</span>
          </span>
          <ChevronRight aria-hidden className={styles.chevron} />
        </Link>
      )}
    </aside>
  );
}
