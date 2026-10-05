import { Link } from "react-router";

import styles from "./Logo.module.css";

/**
 * Isotipo de reta.cl: una "r" minúscula con un punto (el de ".cl").
 * Toma los colores del tema (fondo = color principal).
 */
export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg className={styles.mark} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" className={styles.markBg} />
      <path
        d="M14 29V18.5C14 14.9 16.4 12.5 20 12.5H23"
        className={styles.markStroke}
        fill="none"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26.5" cy="27" r="2.8" className={styles.markDot} />
    </svg>
  );
}

type LogoProps = {
  to: string;
  /** Oculta el nombre en pantallas pequeñas (queda solo el isotipo). */
  compactOnMobile?: boolean;
};

/** Isotipo + nombre "reta.cl". */
export function Logo({ to, compactOnMobile = false }: LogoProps) {
  return (
    <Link to={to} className={styles.logo} aria-label="reta.cl, ir al inicio">
      <LogoMark />
      <span className={[styles.wordmark, compactOnMobile && styles.compactText].filter(Boolean).join(" ")}>
        reta<span className={styles.tld}>.cl</span>
      </span>
    </Link>
  );
}
