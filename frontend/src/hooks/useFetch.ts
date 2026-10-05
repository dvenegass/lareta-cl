import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

import { ApiError } from "../api/client";

/**
 * Carga datos al montar el componente (y cuando cambian `deps`).
 * Devuelve estado de carga, error, `setData` para actualizar tras una acción
 * y `reload` para volver a pedir los datos al servidor.
 */
export function useFetch<T>(load: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [version, setVersion] = useState(0);
  const lastVersion = useRef(version);

  useEffect(() => {
    let isCurrent = true; // ignora respuestas de peticiones ya obsoletas
    // Al recargar (`reload`) se mantiene lo que ya se ve, sin volver a "Cargando…".
    const isReload = version !== lastVersion.current;
    lastVersion.current = version;
    if (!isReload) setIsLoading(true);
    setError(null);

    load()
      .then((result) => isCurrent && setData(result))
      .catch((err) => isCurrent && setError(err instanceof ApiError ? err : new ApiError(0, null)))
      .finally(() => isCurrent && setIsLoading(false));

    return () => {
      isCurrent = false;
    };
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, setData, isLoading, error, reload };
}
