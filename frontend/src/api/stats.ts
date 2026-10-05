import type { ProfileStats, Rankings } from "../types";
import { request } from "./client";

export const getMyStats = () => request<ProfileStats>("/stats/me/");

/** Sin `groupId`: entre tus amigos. Con `groupId`: entre los miembros del grupo. */
export const getRankings = (groupId?: number) =>
  request<Rankings>(groupId ? `/stats/rankings/?group=${groupId}` : "/stats/rankings/");
