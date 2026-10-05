import { UsersRound } from "lucide-react";

import type { GroupRef } from "../../types";
import styles from "./GroupAvatar.module.css";

type GroupAvatarProps = {
  group: Pick<GroupRef, "name" | "photo">;
  size?: number;
};

/** Foto del grupo o, si no tiene, el icono de grupo sobre un fondo neutro. */
export function GroupAvatar({ group, size = 46 }: GroupAvatarProps) {
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.3) };

  if (group.photo) {
    return <img src={group.photo} alt={group.name} className={styles.avatar} style={style} />;
  }

  return (
    <span className={[styles.avatar, styles.placeholder].join(" ")} style={style} role="img" aria-label={group.name}>
      <UsersRound style={{ width: size * 0.46, height: size * 0.46 }} aria-hidden />
    </span>
  );
}
