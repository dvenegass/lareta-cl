import { createContext, useEffect, useState, type ReactNode } from "react";

import * as authApi from "../api/auth";
import type { CurrentUser } from "../types";

export type AuthContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (credentials: authApi.Credentials) => Promise<void>;
  register: (data: authApi.RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (data: authApi.PasswordResetData) => Promise<void>;
  setUser: (user: CurrentUser) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al abrir la app: pedimos la cookie CSRF y comprobamos si hay sesión activa.
  useEffect(() => {
    authApi
      .fetchCsrfCookie()
      .then(authApi.getMe)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    setUser,
    login: async (credentials) => setUser(await authApi.login(credentials)),
    register: async (data) => setUser(await authApi.register(data)),
    resetPassword: async (data) => setUser(await authApi.confirmPasswordReset(data)),
    logout: async () => {
      await authApi.logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
