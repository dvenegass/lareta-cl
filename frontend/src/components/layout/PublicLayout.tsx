import { Outlet } from "react-router";

import { BackgroundDecor } from "./BackgroundDecor";
import { Navbar } from "./Navbar";
import styles from "./PublicLayout.module.css";

/** Páginas públicas: barra simple arriba y contenido centrado. */
export function PublicLayout() {
  return (
    <>
      <BackgroundDecor variant="public" />
      <div className={styles.layer}>
        <Navbar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
