import { Camera, Trash2 } from "lucide-react";
import { useState, type ChangeEvent } from "react";

import type { GroupDetail } from "../../types";
import { GroupAvatar } from "./GroupAvatar";
import styles from "./GroupPhoto.module.css";

const MAX_BYTES = 5 * 1024 * 1024;

type GroupPhotoProps = {
  group: GroupDetail;
  onChange: (file: File) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
};

/** Foto grande del grupo. Quien administra ve los botones para cambiarla o quitarla. */
export function GroupPhoto({ group, onChange, onRemove }: GroupPhotoProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("La foto no puede pesar más de 5 MB.");
      return;
    }
    setError(null);
    setIsSaving(true);
    await onChange(file);
    setIsSaving(false);
  }

  async function handleRemove() {
    setIsSaving(true);
    await onRemove();
    setIsSaving(false);
  }

  return (
    <div className={styles.wrapper}>
      <div className={[styles.photo, isSaving && styles.saving].filter(Boolean).join(" ")}>
        <GroupAvatar group={group} size={88} />
      </div>

      {group.is_owner && (
        <div className={styles.actions}>
          <label className={styles.action}>
            <Camera aria-hidden />
            {group.photo ? "Cambiar foto" : "Subir foto"}
            <input type="file" accept="image/*" onChange={handleFile} disabled={isSaving} hidden />
          </label>
          {group.photo && (
            <button type="button" className={styles.action} onClick={handleRemove} disabled={isSaving}>
              <Trash2 aria-hidden />
              Quitar
            </button>
          )}
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
