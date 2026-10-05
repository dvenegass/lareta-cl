import type { ReactNode } from "react";

import type { User } from "../../types";
import { Avatar } from "./Avatar";
import { UserLink } from "./UserLink";
import styles from "./UserRow.module.css";

type UserRowProps = {
  user: User;
  /** Texto pequeño bajo el nombre, p. ej. "Administra". */
  detail?: ReactNode;
  /** Botones a la derecha. */
  actions?: ReactNode;
};

/** Una persona en una lista: avatar y nombre (abren su perfil) y acciones. */
export function UserRow({ user, detail, actions }: UserRowProps) {
  return (
    <li className={styles.row}>
      <UserLink username={user.username} className={styles.person}>
        <Avatar user={user} size={38} />
        <span className={styles.text}>
          <span className={styles.name}>{user.username}</span>
          {detail && <span className={styles.detail}>{detail}</span>}
        </span>
      </UserLink>
      {actions && <span className={styles.actions}>{actions}</span>}
    </li>
  );
}

/** Contenedor de filas `UserRow`. */
export function UserList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}
