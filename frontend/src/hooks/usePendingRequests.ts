import { useEffect } from "react";
import { useLocation } from "react-router";

import { listFriendRequests } from "../api/friends";
import { useAuth } from "./useAuth";
import { useFetch } from "./useFetch";
import { FRIENDS_CHANGED_EVENT } from "./useFriends";

/** Cuántas solicitudes de amistad tengo sin responder (se revisa al cambiar de página). */
export function usePendingRequests() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { data, reload } = useFetch(
    () => (user ? listFriendRequests() : Promise.resolve(null)),
    [user?.id, pathname],
  );

  // Al aceptar/rechazar en la página de amigos, el contador se actualiza al momento.
  useEffect(() => {
    window.addEventListener(FRIENDS_CHANGED_EVENT, reload);
    return () => window.removeEventListener(FRIENDS_CHANGED_EVENT, reload);
  }, [reload]);

  return data?.incoming.length ?? 0;
}
