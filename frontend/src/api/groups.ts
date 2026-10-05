import type { GroupDetail, GroupSummary } from "../types";
import { request } from "./client";

export const listGroups = () => request<GroupSummary[]>("/groups/");

export const getGroup = (id: number) => request<GroupDetail>(`/groups/${id}/`);

export const createGroup = (data: { name: string; description: string; member_ids: number[] }) =>
  request<GroupDetail>("/groups/", { method: "POST", body: data });

/** JSON ({ name, description, photo: null }) o FormData (para subir la foto). Solo quien administra. */
export const updateGroup = (id: number, data: { name?: string; description?: string; photo?: null } | FormData) =>
  request<GroupDetail>(`/groups/${id}/`, { method: "PATCH", body: data });

export const deleteGroup = (id: number) => request<void>(`/groups/${id}/`, { method: "DELETE" });

export const addGroupMember = (id: number, userId: number) =>
  request<GroupDetail>(`/groups/${id}/members/`, { method: "POST", body: { user_id: userId } });

/** Sacar a alguien (devuelve el grupo actualizado). */
export const removeGroupMember = (id: number, userId: number) =>
  request<GroupDetail>(`/groups/${id}/members/${userId}/`, { method: "DELETE" });

/** Salirse del grupo (no devuelve nada: ya no eres miembro). */
export const leaveGroup = (id: number, myUserId: number) =>
  request<void>(`/groups/${id}/members/${myUserId}/`, { method: "DELETE" });
