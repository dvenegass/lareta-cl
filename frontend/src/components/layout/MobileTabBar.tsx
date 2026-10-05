import { Plus } from "lucide-react";
import { NavLink } from "react-router";

import { NAV_ITEMS } from "./navItems";
import styles from "./MobileTabBar.module.css";

/** Pestañas fijas abajo, solo en móvil (reemplaza a la barra lateral). */
export function MobileTabBar({ pendingRequests }: { pendingRequests: number }) {
  const [home, groups, friends, rankings] = NAV_ITEMS;
  // "Nueva junta" va al centro, como botón destacado.
  const items = [home, groups, null, friends, rankings];

  return (
    <nav className={styles.bar} aria-label="Principal">
      {items.map((item) =>
        item === null ? (
          <NavLink key="new" to="/events/new" className={styles.create} aria-label="Nueva junta">
            <Plus aria-hidden />
          </NavLink>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => [styles.tab, isActive && styles.active].filter(Boolean).join(" ")}
          >
            <span className={styles.iconWrap}>
              <item.icon aria-hidden />
              {item.showsFriendRequests && pendingRequests > 0 && <span className={styles.badge} />}
            </span>
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}
