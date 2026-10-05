import { useState } from "react";

import { ApiError } from "../api/client";
import * as friendsApi from "../api/friends";
import { getUserProfile } from "../api/profiles";
import { useFetch } from "./useFetch";
import { FRIENDS_CHANGED_EVENT } from "./useFriends";

/** Perfil de una persona + las acciones de amistad desde su perfil. */
export function useUserProfile(username: string) {
  const { data: profile, isLoading, error, reload } = useFetch(() => getUserProfile(username), [username]);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setIsSaving(true);
    setActionError(null);
    try {
      await action();
      reload();
      window.dispatchEvent(new Event(FRIENDS_CHANGED_EVENT)); // actualiza el contador de la barra
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo completar la acción.");
    } finally {
      setIsSaving(false);
    }
  }

  const requestId = profile?.pending_request_id ?? null;

  return {
    profile,
    isLoading,
    error,
    isSaving,
    actionError,
    addFriend: () => run(() => friendsApi.sendFriendRequest(username)),
    accept: () => requestId !== null && run(() => friendsApi.acceptFriendRequest(requestId)),
    cancelOrDecline: () => requestId !== null && run(() => friendsApi.deleteFriendRequest(requestId)),
    removeFriend: () => profile && run(() => friendsApi.removeFriend(profile.user.id)),
  };
}
