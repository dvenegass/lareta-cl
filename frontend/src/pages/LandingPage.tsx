import { CalendarPlus, Clock, MapPin, Send, UserCheck, Users } from "lucide-react";

import { LogoMark } from "../components/layout/Logo";
import { ButtonLink } from "../components/ui/Button";import { APP_NAME } from "../config";
import styles from "./LandingPage.module.css";

const STEPS = [
  {
    icon: CalendarPlus,
    color: "var(--accent-1)",
    title: "Crea la junta",
    text: "Nombre, fecha, hora y lugar. Listo en menos de un minuto.",
  },
  {
    icon: Send,
    color: "var(--accent-2)",
    title: "Comparte el enlace",
    text: "Mándalo por WhatsApp, Discord o donde estén tus amigos.",
  },
  {
    icon: UserCheck,
    color: "var(--accent-4)",
    title: "Mira quién va",
    text: "Cada uno confirma si asistirá y todos ven la lista al día.",
  },
];

export function LandingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.kicker}>
            <LogoMark size={22} /> {APP_NAME}
          </span>
          <h1 className={styles.title}>Organizar juntas con amigos, sin el caos del grupo.</h1>
          <p className={styles.lead}>
            Crea la junta, comparte el enlace y ve quién se apunta. Así de simple.
          </p>
          <div className={styles.ctas}>
            <ButtonLink to="/register?next=/events/new" icon={<CalendarPlus />}>
              Crear una junta
            </ButtonLink>
            <ButtonLink to="/login" variant="secondary">
              Iniciar sesión
            </ButtonLink>
          </div>
        </div>

        {/* Tarjeta de ejemplo, solo decorativa */}
        <div className={styles.preview} aria-hidden>
          <div className={styles.previewCard}>
            <div className={styles.previewDate}>
              <strong>25</strong>
              <span>oct</span>
            </div>
            <div>
              <p className={styles.previewTitle}>Junta de fin de mes</p>
              <p className={styles.previewMeta}>
                <Clock /> 20:00
              </p>
              <p className={styles.previewMeta}>
                <MapPin /> Casa de Diego
              </p>
            </div>
            <p className={styles.previewGoing}>
              <Users /> 6 van
            </p>
          </div>        </div>
      </section>

      <section className={styles.how}>
        <h2 className={styles.howTitle}>¿Cómo funciona?</h2>
        <ol className={styles.steps}>
          {STEPS.map(({ icon: Icon, color, title, text }, index) => (
            <li key={title} className={styles.step}>
              <span className={styles.stepIcon} style={{ background: color }}>
                <Icon aria-hidden />
              </span>
              <h3>
                {index + 1}. {title}
              </h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
