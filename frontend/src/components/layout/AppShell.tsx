import { Outlet } from "react-router";

import { usePendingRequests } from "../../hooks/usePendingRequests";
import styles from "./AppShell.module.css";
import { BackgroundDecor } from "./BackgroundDecor";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Estructura de la app con sesión iniciada: barra lateral + contenido (+ pestañas en móvil). */
export function AppShell() {
  const pendingRequests = usePendingRequests();

  return (
    <>
      <BackgroundDecor variant="app" />
      <div className={styles.shell}>
        <div className={styles.sidebar}>
          <Sidebar pendingRequests={pendingRequests} />
        </div>

        <div className={styles.content}>
          <Topbar />
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>

        <MobileTabBar pendingRequests={pendingRequests} />
      </div>
    </>
  );
}
