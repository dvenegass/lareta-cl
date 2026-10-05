// Acentos generados a partir del color del tema (ver styles/tokens.css).
const PASTELS = ["var(--accent-1)", "var(--accent-2)", "var(--accent-3)", "var(--accent-4)", "var(--accent-5)"];

/** Devuelve siempre el mismo acento para el mismo texto (id, username...). */
export function pastelFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PASTELS[hash % PASTELS.length];
}
