import { ChevronLeft, ChevronRight, Download, Trash2, X } from "lucide-react";
import { useEffect } from "react";

import type { EventPhoto } from "../../types";
import { timeAgo } from "../../utils/dates";
import { Avatar } from "../ui/Avatar";
import styles from "./PhotoLightbox.module.css";

type PhotoLightboxProps = {
  photos: EventPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onDelete: (photo: EventPhoto) => void;
};

/** Visor a pantalla completa: flechas (o ← →) para pasar, Esc para cerrar. */
export function PhotoLightbox({ photos, index, onIndexChange, onClose, onDelete }: PhotoLightboxProps) {
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && hasNext) onIndexChange(index + 1);
    }
    document.addEventListener("keydown", onKeyDown);
    // Mientras el visor está abierto, la página de atrás no se desplaza.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, hasPrev, hasNext, onClose, onIndexChange]);

  if (!photo) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Foto del álbum" onClick={onClose}>
      {/* Los clics dentro del contenido no cierran el visor */}
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.toolbar}>
          <span className={styles.author}>
            <Avatar user={photo.uploaded_by} size={28} />
            <span>
              <strong>{photo.uploaded_by.username}</strong> · {timeAgo(photo.created_at)}
            </span>
          </span>
          <span className={styles.counter}>
            {index + 1} / {photos.length}
          </span>
          <div className={styles.tools}>
            <a href={photo.image} target="_blank" rel="noreferrer" className={styles.tool} aria-label="Abrir original">
              <Download aria-hidden />
            </a>
            {photo.can_delete && (
              <button type="button" className={styles.tool} onClick={() => onDelete(photo)} aria-label="Borrar foto">
                <Trash2 aria-hidden />
              </button>
            )}
            <button type="button" className={styles.tool} onClick={onClose} aria-label="Cerrar">
              <X aria-hidden />
            </button>
          </div>
        </div>

        <div className={styles.stage}>
          {hasPrev && (
            <button
              type="button"
              className={[styles.nav, styles.prev].join(" ")}
              onClick={() => onIndexChange(index - 1)}
              aria-label="Foto anterior"
            >
              <ChevronLeft aria-hidden />
            </button>
          )}
          <img
            key={photo.id}
            src={photo.image}
            alt={`Foto de ${photo.uploaded_by.username}`}
            width={photo.width ?? undefined}
            height={photo.height ?? undefined}
            className={styles.image}
          />
          {hasNext && (
            <button
              type="button"
              className={[styles.nav, styles.next].join(" ")}
              onClick={() => onIndexChange(index + 1)}
              aria-label="Foto siguiente"
            >
              <ChevronRight aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
