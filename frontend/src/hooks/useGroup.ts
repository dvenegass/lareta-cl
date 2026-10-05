import { useState } from "react";

import { ApiError } from "../api/client";
import * as groupsApi from "../api/groups";
import type { GroupDetail } from "../types";
import { useFetch } from "./useFetch";

/** Un grupo y las acciones sobre él. */
export function useGroup(groupId: number) {
  const { data: group, setData, isLoading, error } = useFetch(() => groupsApi.getGroup(groupId), [groupId]);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Las acciones que devuelven el grupo actualizado lo reemplazan en pantalla. */
  async function run(action: () => Promise<GroupDetail | void>) {
    setActionError(null);
    try {
      const updated = await action();
      if (updated) setData(updated);
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo completar la acción.");
      return false;
    }
  }

  return {
    group,
    isLoading,
    error,
    actionError,
    update: (data: { name: string; description: string }) => run(() => groupsApi.updateGroup(groupId, data)),
    changePhoto: (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return run(() => groupsApi.updateGroup(groupId, formData));
    },
    removePhoto: () => run(() => groupsApi.updateGroup(groupId, { photo: null })),
    addMembers: (userIds: number[]) =>
      run(async () => {
        let updated: GroupDetail | undefined;
        for (const userId of userIds) updated = await groupsApi.addGroupMember(groupId, userId);
        return updated;
      }),
    removeMember: (userId: number) => run(() => groupsApi.removeGroupMember(groupId, userId)),
    leave: (myUserId: number) => run(() => groupsApi.leaveGroup(groupId, myUserId)),
    remove: () => run(() => groupsApi.deleteGroup(groupId)),
  };
}
