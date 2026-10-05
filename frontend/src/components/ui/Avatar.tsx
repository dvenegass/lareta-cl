import type { User } from "../../types";
import { pastelFor } from "../../utils/colors";
import styles from "./Avatar.module.css";

type AvatarProps = {
  user: Pick<User, "username" | "avatar">;
  size?: number;
};

/** Foto del usuario o, si no tiene, su inicial sobre un color pastel. */
export function Avatar({ user, size = 36 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.42 };

  if (user.avatar) {
    return <img src={user.avatar} alt={user.username} className={styles.avatar} style={style} />;
  }

  return (
    <span
      className={styles.avatar}
      style={{ ...style, background: pastelFor(user.username) }}
      aria-label={user.username}
      role="img"
    >
      {user.username.charAt(0).toUpperCase()}
    </span>
  );
}
