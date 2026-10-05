import styles from "./BackgroundDecor.module.css";

/** Puntos de una estrella "estallido" de `spikes` puntas, centrada en (50, 50). */
function burstPoints(spikes: number, outer = 50, inner = 32) {
  return Array.from({ length: spikes * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    return `${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`;
  }).join(" ");
}

const BURST = burstPoints(14);

/** Destello de cuatro puntas con lados curvos, en un cuadro de 24 × 24. */
const SPARKLE = "M12 0 Q13.2 10.8 24 12 Q13.2 13.2 12 24 Q10.8 13.2 0 12 Q10.8 10.8 12 0 Z";

type BackgroundDecorProps = {
  /** "public" = más color (landing, login); "app" = casi monocromático, para no competir con el contenido. */
  variant?: "public" | "app";
};

/**
 * Fondo decorativo fijo y estático, en capas:
 * degradados difusos + trama de puntos + formas superpuestas que se desvanecen
 * hacia sus bordes. Usa los colores del tema y no recibe clics.
 */
export function BackgroundDecor({ variant = "app" }: BackgroundDecorProps) {
  const shape = (name: string) => [styles.shape, styles[name]].join(" ");

  return (
    <div className={[styles.decor, styles[variant]].join(" ")} aria-hidden="true">
      {/* Profundidad: degradados difusos */}
      <span className={shape("meshTop")} />
      <span className={shape("meshBottom")} />

      {/* Textura: trama de puntos que se desvanece */}
      <span className={shape("dots")} />

      {/* Arriba a la izquierda: arcos concéntricos saliendo de la esquina */}
      <svg className={shape("cornerArcs")} viewBox="0 0 100 100">
        <circle cx="0" cy="0" r="40" />
        <circle cx="0" cy="0" r="62" />
        <circle cx="0" cy="0" r="84" />
      </svg>

      {/* Arriba a la derecha: "sistema solar" con órbita punteada, anillos y estrella */}
      <span className={shape("orbit")} />
      <span className={shape("planet")} />
      <span className={shape("ringThin")} />
      <span className={shape("ring")} />
      <svg className={shape("burst")} viewBox="0 0 100 100">
        <polygon points={BURST} />
      </svg>

      {/* Lado derecho: destellos */}
      <svg className={shape("sparkles")} viewBox="0 0 80 70">
        <path d={SPARKLE} transform="translate(30 0) scale(1.4)" />
        <path d={SPARKLE} transform="translate(0 38) scale(0.8)" />
        <path d={SPARKLE} transform="translate(58 46) scale(0.6)" />
      </svg>

      {/* Abajo a la izquierda: medio círculo rayado detrás de dos medios círculos */}
      <span className={shape("halfStriped")} />
      <span className={shape("halfBig")} />
      <span className={shape("halfSmall")} />

      {/* Detalle: punto relleno + aro pequeño */}
      <span className={shape("dotFilled")} />
      <span className={shape("dotOutline")} />
    </div>
  );
}
