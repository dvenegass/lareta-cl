import { useState } from "react";

import { ApiError } from "../api/client";
import * as photosApi from "../api/photos";
import { validateImageFile } from "../utils/images";
import { useFetch } from "./useFetch";

/** Álbum de una junta: ver, subir (varias a la vez) y borrar fotos. */
export function usePhotos(eventId: string) {
  const { data, setData, isLoading } = useFetch(() => photosApi.listPhotos(eventId), [eventId]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const photos = data ?? [];

  /** Sube las fotos una por una (así se ve el avance y un error no frena las demás). */
  async function upload(files: File[]) {
    setActionError(null);
    const valid = files.filter((file) => {
      const error = validateImageFile(file);
      if (error) setActionError(error);
      return !error;
    });
    if (valid.length === 0) return;

    setProgress({ done: 0, total: valid.length });
    for (const [index, file] of valid.entries()) {
      try {
        const photo = await photosApi.uploadPhoto(eventId, file);
        setData((current) => [...(current ?? []), photo]);
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : `No se pudo subir «${file.name}».`);
      }
      setProgress({ done: index + 1, total: valid.length });
    }
    setProgress(null);
  }

  async function remove(photoId: number) {
    setActionError(null);
    try {
      await photosApi.deletePhoto(photoId);
      setData((current) => (current ?? []).filter((p) => p.id !== photoId));
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo borrar la foto.");
      return false;
    }
  }

  return { photos, isLoading, progress, actionError, upload, remove };
}
