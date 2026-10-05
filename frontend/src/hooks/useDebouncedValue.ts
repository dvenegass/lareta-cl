import { useEffect, useState } from "react";

/** Devuelve `value` solo cuando deja de cambiar durante `delay` ms (p. ej. al escribir en un buscador). */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
