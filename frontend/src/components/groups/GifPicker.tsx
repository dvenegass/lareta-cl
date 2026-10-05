import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { searchGifs } from "../../api/chat";
import { ApiError } from "../../api/client";
import type { Gif } from "../../types";
import styles from "./GifPicker.module.css";

/** Espera tras dejar de escribir antes de buscar (no buscar en cada tecla). */
const SEARCH_DELAY_MS = 400;

type GifPickerProps = {
  onPick: (gif: Gif) => void;
  onClose: () => void;
};

/** Buscador de GIFs de KLIPY, como el de Discord: escribes, eliges y se envía. */
export function GifPicker({ onPick, onClose }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Busca (con retraso) cada vez que cambia el texto; vacío = los del momento.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchGifs(query.trim());
        if (cancelled) return;
        setGifs(data.results);
        setHasNext(data.has_next);
        setPage(1);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudieron cargar los GIFs.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, query ? SEARCH_DELAY_MS : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  // Cierra con Escape o al hacer clic fuera del panel.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element;
      // El botón que abre/cierra el panel se encarga solo (si no, se cerraría y reabriría).
      if (panelRef.current?.contains(target) || target.closest("[data-gif-toggle]")) return;
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose]);

  async function loadMore() {
    setIsLoading(true);
    try {
      const data = await searchGifs(query.trim(), page + 1);
      setGifs((current) => [...current, ...data.results.filter((g) => !current.some((c) => c.id === g.id))]);
      setHasNext(data.has_next);
      setPage(page + 1);
    } catch {
      setError("No se pudieron cargar más GIFs.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.panel} ref={panelRef} role="dialog" aria-label="Buscar GIFs">
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <Search aria-hidden />
          <input
            type="search"
            placeholder="Buscar en KLIPY…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            aria-label="Buscar GIFs"
          />
        </label>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
          <X aria-hidden />
        </button>
      </div>

      <div className={styles.results}>
        {error ? (
          <p className={styles.message}>{error}</p>
        ) : !isLoading && gifs.length === 0 ? (
          <p className={styles.message}>No encontramos GIFs para «{query}».</p>
        ) : (
          <div className={styles.grid}>
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                className={styles.gif}
                onClick={() => onPick(gif)}
                title={gif.title}
              >
                <img
                  src={gif.preview_url}
                  alt={gif.title || "GIF"}
                  width={gif.preview_width ?? undefined}
                  height={gif.preview_height ?? undefined}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
        {isLoading && <p className={styles.message}>Cargando…</p>}
        {!isLoading && !error && hasNext && (
          <button type="button" className={styles.more} onClick={loadMore}>
            Ver más
          </button>
        )}
      </div>

      <a className={styles.credit} href="https://klipy.com" target="_blank" rel="noreferrer">
        GIFs de KLIPY
      </a>
    </div>
  );
}
