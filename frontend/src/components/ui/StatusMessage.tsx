import type { ReactNode } from "react";

import styles from "./StatusMessage.module.css";

type StatusMessageProps = {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  tone?: "neutral" | "error";
};

/** Mensaje centrado para estados vacíos, de carga o de error. */
export function StatusMessage({ icon, title, children, tone = "neutral" }: StatusMessageProps) {
  return (
    <div className={[styles.box, styles[tone]].join(" ")} role={tone === "error" ? "alert" : undefined}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <p className={styles.title}>{title}</p>
      {children && <div className={styles.body}>{children}</div>}
    </div>
  );
}
