import { AlarmClockCheck, Beer, CalendarCheck, Lock, MapPinned, type LucideIcon } from "lucide-react";

import type { UserProfile } from "../../types";
import { Card } from "../ui/Card";
import styles from "./ProfileStats.module.css";

const ITEMS: { key: keyof NonNullable<UserProfile["stats"]>; label: string; icon: LucideIcon }[] = [
  { key: "attended", label: "Juntas asistidas", icon: Beer },
  { key: "on_time", label: "Llegó a tiempo", icon: AlarmClockCheck },
  { key: "events_organized", label: "Organizadas", icon: CalendarCheck },
  { key: "places", label: "Lugares", icon: MapPinned },
];

/** Cifras de la persona. Si no son amigos, se explica por qué no se ven. */
export function ProfileStats({ profile }: { profile: UserProfile }) {
  if (!profile.stats) {
    return (
      <Card className={styles.locked}>
        <span className={styles.lockIcon} aria-hidden>
          <Lock />
        </span>
        <p>
          Agrega a <strong>{profile.user.username}</strong> como amigo para ver sus estadísticas.
        </p>
      </Card>
    );
  }

  return (
    <Card className={styles.grid}>
      {ITEMS.map(({ key, label, icon: Icon }) => (
        <div key={key} className={styles.stat}>
          <span className={styles.icon} aria-hidden>
            <Icon />
          </span>
          <span className={styles.value}>{profile.stats![key]}</span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </Card>
  );
}
