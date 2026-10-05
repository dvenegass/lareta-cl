import { ListChecks, MessageSquare, Vote, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Toggle } from "../ui/Toggle";
import styles from "./EventSectionsField.module.css";

export type EventSections = {
  bringListEnabled: boolean;
  pollsEnabled: boolean;
  commentsEnabled: boolean;
};

type SectionKey = keyof EventSections;

const SECTIONS: { key: SectionKey; label: string; hint: string; icon: LucideIcon }[] = [
  { key: "bringListEnabled", label: "Qué llevar", hint: "Cada uno marca lo que trae.", icon: ListChecks },
  { key: "pollsEnabled", label: "Votaciones", hint: "Para decidir lugar, comida, etc.", icon: Vote },
  { key: "commentsEnabled", label: "Comentarios", hint: "Un hilo para coordinarse.", icon: MessageSquare },
];

type EventSectionsFieldProps = {
  value: EventSections;
  onChange: (value: EventSections) => void;
  /** Contenido extra bajo "Qué llevar" cuando está activo (la lista inicial al crear). */
  bringListExtra?: ReactNode;
};

/** Qué secciones tendrá la página de la junta. */
export function EventSectionsField({ value, onChange, bringListExtra }: EventSectionsFieldProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>¿Qué incluye esta junta?</legend>
      <ul className={styles.list}>
        {SECTIONS.map(({ key, label, hint, icon: Icon }) => (
          <li key={key} className={styles.row}>
            <div className={styles.header}>
              <span className={styles.icon} aria-hidden>
                <Icon />
              </span>
              <span className={styles.text}>
                <strong>{label}</strong>
                <span>{hint}</span>
              </span>
              <Toggle checked={value[key]} onChange={(checked) => onChange({ ...value, [key]: checked })} label={label} />
            </div>
            {key === "bringListEnabled" && value.bringListEnabled && bringListExtra && (
              <div className={styles.extra}>{bringListExtra}</div>
            )}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
