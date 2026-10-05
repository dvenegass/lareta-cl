import type { ReactNode } from "react";

import { Card } from "../ui/Card";
import styles from "./AuthCard.module.css";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

/** Tarjeta centrada para login y registro. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {children}
        <p className={styles.footer}>{footer}</p>
      </Card>
    </div>
  );
}
