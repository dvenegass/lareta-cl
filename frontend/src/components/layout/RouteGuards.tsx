import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";

import { useAuth } from "../../hooks/useAuth";
import { AppLoader } from "../ui/Skeleton";

/** Lee `?next=` solo si es una ruta interna (evita redirigir a otros sitios). */
export function useNextPath(fallback = "/dashboard") {
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Solo para usuarios con sesión. Si no, va al login y luego vuelve aquí. */
export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AppLoader />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

/**
 * Solo para visitantes (landing, login, registro). En cuanto hay sesión
 * (por ejemplo, justo después de iniciarla) redirige a `next` o al dashboard.
 */
export function RequireGuest() {
  const { user, isLoading } = useAuth();
  const nextPath = useNextPath();

  if (isLoading) return <AppLoader />;
  if (user) return <Navigate to={nextPath} replace />;
  return <Outlet />;
}
