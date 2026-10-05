import type { UserProfile } from "../types";
import { request } from "./client";

export const getUserProfile = (username: string) =>
  request<UserProfile>(`/users/${encodeURIComponent(username)}/profile/`);
