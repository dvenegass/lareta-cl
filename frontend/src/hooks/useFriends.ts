import { useState } from "react";

import { ApiError } from "../api/client";
import * as friendsApi from "../api/friends";
import { useFetch } from "./useFetch";

/** Se emite al cambiar amistades/solicitudes, para que la barra actualice su contador. */
export const FRIENDS_CHANGED_EVENT = "friends:changed";

/** Amigos, solicitudes pendientes y las acciones sobre ellos. */
export function useFriends() {
  const friends = useFetch(friendsApi.listFriends, []);
  const requests = useFetch(friendsApi.listFriendRequests, []);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Ejecuta la acción y recarga las listas. Devuelve true si salió bien. */
  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      friends.reload();
      requests.reload();
      window.dispatchEvent(new Event(FRIENDS_CHANGED_EVENT));
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo completar la acción.");
      return false;
    }
  }

  return {
    friends: friends.data ?? [],
    incoming: requests.data?.incoming ?? [],
    outgoing: requests.data?.outgoing ?? [],
    isLoading: friends.isLoading || requests.isLoading,
    actionError,
    // Si esa persona ya me había enviado una solicitud, enviar una la acepta.
    sendRequest: (username: string) => run(() => friendsApi.sendFriendRequest(username)),
    accept: (requestId: number) => run(() => friendsApi.acceptFriendRequest(requestId)),
    decline: (requestId: number) => run(() => friendsApi.deleteFriendRequest(requestId)),
    remove: (userId: number) => run(() => friendsApi.removeFriend(userId)),
  };
}
