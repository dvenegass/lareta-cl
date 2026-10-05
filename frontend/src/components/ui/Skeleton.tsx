import type { CSSProperties, ReactNode } from "react";

import { LogoMark } from "../layout/Logo";
import styles from "./Skeleton.module.css";

type BoneProps = {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  /** "pill" para botones/chips, "circle" para avatares. */
  shape?: "line" | "pill" | "circle" | "block";
};

/** Un bloque gris con brillo animado que ocupa el lugar del contenido. */
export function Bone({ width = "100%", height = 12, shape = "line" }: BoneProps) {
  return <span className={[styles.bone, styles[shape]].join(" ")} style={{ width, height }} />;
}

/**
 * Contenedor común: anuncia la carga a lectores de pantalla y aparece con
 * un pequeño retraso, así las cargas rápidas no producen un parpadeo.
 */
function Loading({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={[styles.loading, className].filter(Boolean).join(" ")} role="status" aria-label={label}>
      {children}
    </div>
  );
}

/** Filas tipo lista (avatar + dos líneas): amigos, miembros, juntas. */
export function SkeletonRows({ count = 3, label = "Cargando…" }: { count?: number; label?: string }) {
  return (
    <Loading label={label} className={styles.rows}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.row}>
          <Bone width={40} height={40} shape="circle" />
          <div className={styles.lines}>
            <Bone width={`${55 - i * 8}%`} height={13} />
            <Bone width={`${35 + i * 6}%`} height={10} />
          </div>
        </div>
      ))}
    </Loading>
  );
}

/** Grilla de tarjetas: grupos, juntas, rankings. */
export function SkeletonCards({ count = 3, label = "Cargando…" }: { count?: number; label?: string }) {
  return (
    <Loading label={label} className={styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardHead}>
            <Bone width={44} height={44} shape="block" />
            <div className={styles.lines}>
              <Bone width="70%" height={14} />
              <Bone width="45%" height={10} />
            </div>
          </div>
          <Bone width="90%" />
          <Bone width="60%" />
          <div className={styles.cardFoot}>
            <Bone width={84} height={24} shape="pill" />
            <Bone width={56} height={24} shape="pill" />
          </div>
        </div>
      ))}
    </Loading>
  );
}

/** Página de detalle (junta, grupo, perfil): cabecera + dos columnas. */
export function SkeletonPage({ label = "Cargando…" }: { label?: string }) {
  return (
    <Loading label={label} className={styles.page}>
      <Bone width={110} height={12} />
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.card}>
            <Bone width={90} height={22} shape="pill" />
            <Bone width="65%" height={26} />
            <div className={styles.cardHead}>
              <Bone width={28} height={28} shape="circle" />
              <Bone width={140} height={12} />
            </div>
            <Bone width="80%" />
            <Bone width="50%" />
            <div className={styles.cardFoot}>
              <Bone width={120} height={36} shape="pill" />
              <Bone width={90} height={36} shape="pill" />
            </div>
          </div>
          <div className={styles.card}>
            <Bone width="35%" height={16} />
            <Bone width="90%" />
            <Bone width="75%" />
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.card}>
            <Bone width="45%" height={16} />
            <div className={styles.cardFoot}>
              <Bone width="30%" height={38} shape="pill" />
              <Bone width="30%" height={38} shape="pill" />
              <Bone width="30%" height={38} shape="pill" />
            </div>
          </div>
          <div className={styles.card}>
            <Bone width="40%" height={16} />
            <SkeletonRowsInline />
          </div>
        </div>
      </div>
    </Loading>
  );
}

function SkeletonRowsInline() {
  return (
    <div className={styles.rows}>
      {[60, 45, 52].map((width, i) => (
        <div key={i} className={styles.row}>
          <Bone width={32} height={32} shape="circle" />
          <Bone width={`${width}%`} height={12} />
        </div>
      ))}
    </div>
  );
}

/** Pantalla completa mientras se comprueba la sesión: el logo "respira". */
export function AppLoader() {
  return (
    <div className={styles.app} role="status" aria-label="Cargando lareta.cl">
      <div className={styles.pulse}>
        <LogoMark size={56} />
      </div>
      <div className={styles.dots} aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
