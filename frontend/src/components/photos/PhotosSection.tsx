import { Camera, ImagePlus } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { usePhotos } from "../../hooks/usePhotos";
import type { EventPhoto } from "../../types";
import { IMAGE_TYPES } from "../../utils/images";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { PhotoLightbox } from "./PhotoLightbox";
import styles from "./PhotosSection.module.css";

type PhotosSectionProps = {
  eventId: string;
  /** Puede subir fotos: la junta ya empezó, no está cancelada y la persona puede participar. */
  canUpload: boolean;
};

/** Álbum de la junta: las fotos del asado, la pichanga… */
export function PhotosSection({ eventId, canUpload }: PhotosSectionProps) {
  const { photos, isLoading, progress, actionError, upload, remove } = usePhotos(eventId);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => setOpenIndex(null), []);

  async function handleDelete(photo: EventPhoto) {
    if (!window.confirm("¿Borrar esta foto del álbum?")) return;
    if (await remove(photo.id)) {
      // Se queda en la foto que ahora ocupa ese lugar (o cierra si era la última).
      setOpenIndex((current) => {
        if (current === null || photos.length <= 1) return null;
        return Math.min(current, photos.length - 2);
      });
    }
  }

  return (
    <Card className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Camera aria-hidden /> Fotos
          {photos.length > 0 && <span className={styles.count}>{photos.length}</span>}
        </h2>
        {canUpload && (
          <>
            <Button
              variant="secondary"
              icon={<ImagePlus />}
              onClick={() => fileInputRef.current?.click()}
              disabled={progress !== null}
            >
              {progress ? `Subiendo ${progress.done + 1} de ${progress.total}…` : "Subir fotos"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              multiple
              hidden
              onChange={(e) => {
                upload([...(e.target.files ?? [])]);
                e.target.value = ""; // permite volver a elegir los mismos archivos
              }}
            />
          </>
        )}
      </div>

      {!isLoading && photos.length === 0 && (
        <p className={styles.empty}>
          {canUpload ? "¿Hubo fotos? Súbelas para que todos las tengan." : "Todavía no hay fotos."}
        </p>
      )}

      {photos.length > 0 && (
        <ul className={styles.grid}>
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                className={styles.thumb}
                onClick={() => setOpenIndex(index)}
                aria-label={`Ver foto ${index + 1} de ${photos.length}`}
              >
                <img src={photo.image} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {actionError && <p className={styles.error}>{actionError}</p>}

      {openIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={close}
          onDelete={handleDelete}
        />
      )}
    </Card>
  );
}
