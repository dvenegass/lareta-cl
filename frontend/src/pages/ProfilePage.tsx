import { Camera, ChevronRight, LogOut, Palette } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router";

import { updateMe } from "../api/auth";
import { ApiError } from "../api/client";
import { getMyStats } from "../api/stats";
import { PageHeader } from "../components/layout/PageHeader";
import { LevelCard } from "../components/stats/LevelCard";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextField } from "../components/ui/TextField";
import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [values, setValues] = useState({ username: user!.username, email: user!.email });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { data: stats } = useFetch(getMyStats, []);

  if (!user) return null; // <RequireAuth> garantiza que hay usuario

  /** Envía cambios al backend y actualiza el usuario en toda la app. */
  async function save(data: Parameters<typeof updateMe>[0], successMessage: string) {
    setIsSaving(true);
    setErrors({});
    setNotice(null);
    try {
      setUser(await updateMe(data));
      setNotice(successMessage);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.fieldErrors : { detail: "No se pudo guardar." });
    } finally {
      setIsSaving(false);
    }
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    save(formData, "Foto actualizada.");
    e.target.value = ""; // permite volver a elegir el mismo archivo
  }

  async function handleLogout() {
    await logout();
    // Recarga completa: limpia cualquier estado en memoria de la sesión anterior.
    window.location.assign("/");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save({ username: values.username.trim(), email: values.email.trim() }, "Perfil guardado.");
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Tu perfil" />

      {stats && (
        <div className={styles.level}>
          <LevelCard stats={stats} />
        </div>
      )}

      <Card className={styles.card}>
        <div className={styles.avatarRow}>
          <Avatar user={user} size={84} />
          <div className={styles.avatarActions}>
            <label className={styles.upload}>
              <Camera aria-hidden />
              {user.avatar ? "Cambiar foto" : "Subir foto"}
              <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={isSaving} hidden />
            </label>
            {user.avatar && (
              <Button variant="ghost" onClick={() => save({ avatar: null }, "Foto eliminada.")} disabled={isSaving}>
                Quitar foto
              </Button>
            )}
          </div>
        </div>
        {errors.avatar && <p className={styles.error}>{errors.avatar}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <TextField
            label="Nombre de usuario"
            value={values.username}
            onChange={(e) => setValues({ ...values, username: e.target.value })}
            error={errors.username}
            required
          />
          <TextField
            label="Email"
            type="email"
            hint={values.email ? undefined : "Agrégalo para poder recuperar tu contraseña si la olvidas."}
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            error={errors.email}
          />
          {errors.detail && <p className={styles.error}>{errors.detail}</p>}
          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Card>

      <Link to="/settings/appearance" className={styles.settingsLink}>
        <span className={styles.settingsIcon}>
          <Palette aria-hidden />
        </span>
        <span className={styles.settingsText}>
          <strong>Apariencia</strong>
          <span>Color de la app y modo día / noche</span>
        </span>
        <ChevronRight aria-hidden />
      </Link>

      <Button variant="ghost" icon={<LogOut />} onClick={handleLogout} className={styles.logout}>
        Cerrar sesión
      </Button>
    </div>
  );
}
