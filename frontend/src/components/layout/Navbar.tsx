import { useAuth } from "../../hooks/useAuth";
import { ButtonLink } from "../ui/Button";
import { Logo } from "./Logo";
import styles from "./Navbar.module.css";

/** Barra de las páginas públicas (landing, login, registro...). */
export function Navbar() {
  const { user, isLoading } = useAuth();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Logo to={user ? "/dashboard" : "/"} compactOnMobile />

        <div className={styles.actions}>
          {isLoading ? null : user ? (
            <ButtonLink to="/dashboard">Ir al inicio</ButtonLink>
          ) : (
            <>
              <ButtonLink to="/login" variant="ghost">
                Iniciar sesión
              </ButtonLink>
              <ButtonLink to="/register" className={styles.hideOnMobile}>
                Crear cuenta
              </ButtonLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
