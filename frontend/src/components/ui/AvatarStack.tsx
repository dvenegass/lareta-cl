import type { User } from "../../types";
import { Avatar } from "./Avatar";
import styles from "./AvatarStack.module.css";

type AvatarStackProps = {
  users: User[];
  /** Total real (puede ser mayor que los avatares que se muestran). */
  total?: number;
  size?: number;
};

/** Avatares superpuestos con "+N" si hay más. */
export function AvatarStack({ users, total = users.length, size = 30 }: AvatarStackProps) {
  const extra = total - users.length;
  return (
    <span className={styles.stack}>
      {users.map((user) => (
        <span key={user.id} className={styles.item}>
          <Avatar user={user} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span className={styles.extra} style={{ width: size, height: size }}>
          +{extra}
        </span>
      )}
    </span>
  );
}
