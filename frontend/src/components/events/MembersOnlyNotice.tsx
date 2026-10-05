import { Lock } from "lucide-react";

import styles from "./MembersOnlyNotice.module.css";

/** Reemplaza los botones de asistencia cuando la junta es de un grupo del que no eres miembro. */
export function MembersOnlyNotice({ groupName }: { groupName: string }) {
  return (
    <div className={styles.notice}>
      <span className={styles.icon} aria-hidden>
        <Lock />
      </span>
      <p>
        Esta junta es del grupo <strong>{groupName}</strong>. Solo sus miembros pueden unirse.
      </p>
    </div>
  );
}
