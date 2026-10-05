import type { ReactNode } from "react";
import { Link } from "react-router";

import styles from "./UserLink.module.css";

type UserLinkProps = {
  username: string;
  children: ReactNode;
  className?: string;
};

/** Envuelve el avatar/nombre de alguien para abrir su perfil. */
export function UserLink({ username, children, className }: UserLinkProps) {
  return (
    <Link to={`/users/${encodeURIComponent(username)}`} className={[styles.link, className].filter(Boolean).join(" ")}>
      {children}
    </Link>
  );
}
