import type { CurrentUser } from "../types";
import { request } from "./client";

export type Credentials = { username: string; password: string };
export type RegisterData = Credentials & { email?: string };

export const fetchCsrfCookie = () => request<void>("/auth/csrf/");

export const register = (data: RegisterData) =>
  request<CurrentUser>("/auth/register/", { method: "POST", body: data });

export const login = (credentials: Credentials) =>
  request<CurrentUser>("/auth/login/", { method: "POST", body: credentials });

export const logout = () => request<void>("/auth/logout/", { method: "POST" });

export const getMe = () => request<CurrentUser>("/users/me/");

export const requestPasswordReset = (email: string) =>
  request<void>("/auth/password-reset/", { method: "POST", body: { email } });

export type PasswordResetData = { uid: string; token: string; new_password: string };

/** Guarda la nueva contraseña y deja la sesión iniciada. */
export const confirmPasswordReset = (data: PasswordResetData) =>
  request<CurrentUser>("/auth/password-reset/confirm/", { method: "POST", body: data });

export type ProfileUpdate = Partial<
  Pick<CurrentUser, "username" | "email" | "avatar" | "theme_color" | "theme_mode" | "show_decor">
>;

/** Acepta JSON ({ username }) o FormData (para subir el avatar). */
export const updateMe = (data: ProfileUpdate | FormData) =>
  request<CurrentUser>("/users/me/", { method: "PATCH", body: data });
