import { useEffect, useRef, useState } from "react";

import { updateMe } from "../api/auth";
import type { ThemePreferences } from "../theme/theme";
import type { CurrentUser } from "../types";
import { useAuth } from "./useAuth";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY_MS = 500;

/** Traduce las preferencias a los campos del usuario en el backend. */
function toUserFields({ color, mode, decor }: ThemePreferences) {
  return { theme_color: color, theme_mode: mode, show_decor: decor } satisfies Partial<CurrentUser>;
}

/**
 * Preferencias de apariencia del usuario actual.
 * Cada cambio se ve al instante en toda la app y se guarda en el servidor
 * medio segundo después (así arrastrar el selector de color no hace 50 peticiones).
 */
export function useAppearance() {
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<number | undefined>(undefined);
  const lastSaved = useRef<ThemePreferences | null>(null);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  if (!user) throw new Error("useAppearance requiere un usuario con sesión");

  const current: ThemePreferences = { color: user.theme_color, mode: user.theme_mode, decor: user.show_decor };
  lastSaved.current ??= current;

  function change(patch: Partial<ThemePreferences>) {
    const next = { ...current, ...patch };
    // Actualizar el usuario en el contexto repinta la app con el nuevo tema.
    setUser({ ...user!, ...toUserFields(next) });
    setStatus("saving");

    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await updateMe(toUserFields(next));
        lastSaved.current = next;
        setStatus("saved");
      } catch {
        // Si falla, volvemos a lo último que sí se guardó.
        setUser({ ...user!, ...toUserFields(lastSaved.current!) });
        setStatus("error");
      }
    }, SAVE_DELAY_MS);
  }

  return { preferences: current, change, status };
}
