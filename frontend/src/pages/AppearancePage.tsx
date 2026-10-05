import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import { PageHeader } from "../components/layout/PageHeader";
import { ColorPicker } from "../components/settings/ColorPicker";
import { ThemeModePicker } from "../components/settings/ThemeModePicker";
import { ThemePreview } from "../components/settings/ThemePreview";
import { Card } from "../components/ui/Card";
import { Toggle } from "../components/ui/Toggle";
import { useAppearance } from "../hooks/useAppearance";
import styles from "./AppearancePage.module.css";

const STATUS_TEXT = {
  idle: "",
  saving: "Guardando…",
  saved: "Guardado",
  error: "No se pudo guardar. Inténtalo de nuevo.",
};

export function AppearancePage() {
  const { preferences, change, status } = useAppearance();

  return (
    <div className={styles.page}>
      <Link to="/profile" className={styles.back}>
        <ArrowLeft aria-hidden /> Perfil
      </Link>
      <PageHeader title="Apariencia" subtitle="Elige un color y armamos toda la paleta a partir de él." />

      <Card className={styles.card}>
        <section className={styles.section}>
          <h2 className={styles.heading}>Color principal</h2>
          <ColorPicker value={preferences.color} onChange={(color) => change({ color })} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Modo</h2>
          <ThemeModePicker value={preferences.mode} onChange={(mode) => change({ mode })} />
          {preferences.mode === "system" && (
            <p className={styles.hint}>Cambia entre día y noche según la configuración de tu dispositivo.</p>
          )}
        </section>

        <section className={styles.toggleRow}>
          <div>
            <h2 className={styles.heading}>Figuras de fondo</h2>
            <p className={styles.hint}>Círculos y formas decorativas detrás del contenido.</p>
          </div>
          <Toggle checked={preferences.decor} onChange={(decor) => change({ decor })} label="Figuras de fondo" />
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Vista previa</h2>
          <ThemePreview />
        </section>

        <p className={[styles.status, status === "error" && styles.error].filter(Boolean).join(" ")} role="status">
          {STATUS_TEXT[status]}
        </p>
      </Card>
    </div>
  );
}
