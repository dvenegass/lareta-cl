import { UsersRound } from "lucide-react";
import { Link } from "react-router";

import type { GroupRef } from "../../types";
import styles from "./GroupChip.module.css";

type GroupChipProps = {
  group: GroupRef;
  /** Si es true, enlaza a la página del grupo (solo tiene sentido para sus miembros). */
  linked?: boolean;
};

/** Etiqueta "de qué grupo es" esta junta. */
export function GroupChip({ group, linked = false }: GroupChipProps) {
  const content = (
    <>
      {group.photo ? <img src={group.photo} alt="" className={styles.photo} /> : <UsersRound aria-hidden />}
      {group.name}
    </>
  );
  return linked ? (
    <Link to={`/groups/${group.id}`} className={[styles.chip, styles.link].join(" ")}>
      {content}
    </Link>
  ) : (
    <span className={styles.chip}>{content}</span>
  );
}
