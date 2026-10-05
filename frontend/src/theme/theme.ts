// Tema visual: convierte el color elegido en las variables que usa tokens.css.

export type ThemeMode = "light" | "dark" | "system";

export type ThemePreferences = {
  color: string; // hex, p. ej. "#b9a6f2"
  mode: ThemeMode;
  decor: boolean; // figuras decorativas de fondo
};

export const DEFAULT_THEME: ThemePreferences = { color: "#b9a6f2", mode: "system", decor: true };

export const THEME_PRESETS = [
  { name: "Lavanda", color: "#b9a6f2" },
  { name: "Rosa", color: "#f6a8c4" },
  { name: "Coral", color: "#f4a3a3" },
  { name: "Melocotón", color: "#f8c4a4" },
  { name: "Limón", color: "#f2dc8c" },
  { name: "Menta", color: "#9fdcbf" },
  { name: "Celeste", color: "#9fd0f5" },
  { name: "Grafito", color: "#a9a9b3" },
];

// Debe coincidir con el script de index.html.
const STORAGE_KEY = "reta-theme";

/**
 * De un hex obtiene el tono (0–360) y cuánto color usar (0–1).
 * Solo importan tono y saturación: la luminosidad la decide cada token,
 * así cualquier color elegido produce una paleta pastel legible.
 */
export function themeVariables(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  hue = Math.round((hue * 60 + 360) % 360);

  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  // Los pasteles rara vez superan 0.7 de saturación: amplificamos para que
  // cualquier color "con color" use la paleta completa y los grises queden grises.
  const chroma = Math.min(1, Math.round(saturation * 1.5 * 100) / 100);

  return { hue, chroma };
}

export function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Aplica el tema a toda la página y lo recuerda en este navegador. */
export function applyTheme({ color, mode, decor }: ThemePreferences) {
  const { hue, chroma } = themeVariables(color);
  const root = document.documentElement;
  root.style.setProperty("--hue", String(hue));
  root.style.setProperty("--chroma", String(chroma));
  root.dataset.theme = resolveMode(mode);
  root.dataset.decor = decor ? "on" : "off";

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ color, mode, decor, hue, chroma }));
  } catch {
    // Sin localStorage (modo privado, etc.) el tema funciona igual, solo no se recuerda.
  }
}

/** Último tema usado en este navegador (para visitantes sin sesión). */
export function loadStoredTheme(): ThemePreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (stored?.color && stored?.mode) {
      return { color: stored.color, mode: stored.mode, decor: stored.decor !== false };
    }
  } catch {
    // ignorado: usamos el tema por defecto
  }
  return DEFAULT_THEME;
}
