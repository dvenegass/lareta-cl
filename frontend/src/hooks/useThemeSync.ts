import { useEffect } from "react";

import { applyTheme, loadStoredTheme } from "../theme/theme";
import { useAuth } from "./useAuth";

/**
 * Mantiene la página pintada con el tema del usuario.
 * Con sesión: usa sus preferencias guardadas. Sin sesión: las últimas de este navegador.
 * En modo "system" también reacciona cuando el sistema cambia entre día y noche.
 */
export function useThemeSync() {
  const { user } = useAuth();
  const { color, mode, decor } = user
    ? { color: user.theme_color, mode: user.theme_mode, decor: user.show_decor }
    : loadStoredTheme();

  useEffect(() => {
    applyTheme({ color, mode, decor });
    if (mode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => applyTheme({ color, mode, decor });
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [color, mode, decor]);
}
