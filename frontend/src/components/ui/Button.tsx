import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type StyleProps = {
  variant?: Variant;
  icon?: ReactNode;
  fullWidth?: boolean;
};

function classNames({ variant = "primary", fullWidth }: StyleProps, extra?: string) {
  return [styles.button, styles[variant], fullWidth && styles.fullWidth, extra].filter(Boolean).join(" ");
}

type ButtonProps = StyleProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant, icon, fullWidth, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={classNames({ variant, fullWidth }, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = StyleProps & LinkProps;

/** Un enlace de navegación con aspecto de botón. */
export function ButtonLink({ variant, icon, fullWidth, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={classNames({ variant, fullWidth }, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
