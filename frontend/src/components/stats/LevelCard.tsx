import type { ProfileStats } from "../../types";
import { Card } from "../ui/Card";
import styles from "./LevelCard.module.css";
import { levelIcon } from "./statIcons";

/** Nivel actual, barra de progreso al siguiente y de dónde salen los puntos. */
export function LevelCard({ stats }: { stats: ProfileStats }) {
  const { points, level, next_level: next } = stats;
  const progress = next ? ((points - level.min_points) / (next.min_points - level.min_points)) * 100 : 100;
  const Icon = levelIcon(level.number);
  const NextIcon = next ? levelIcon(next.number) : null;

  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <span className={styles.icon} aria-hidden>
          <Icon />
        </span>
        <div className={styles.info}>
          <p className={styles.levelName}>
            Nivel {level.number} · {level.name}
          </p>
          <p className={styles.points}>
            <strong>{points}</strong> puntos
          </p>
        </div>
      </div>

      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Progreso al siguiente nivel"
      >
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>
      <p className={styles.next}>
        {next && NextIcon ? (
          <>
            {next.min_points - points === 1 ? "Te falta 1 punto" : `Te faltan ${next.min_points - points} puntos`}{" "}
            para
            <span className={styles.nextLevel}>
              <NextIcon aria-hidden /> {next.name}
            </span>
          </>
        ) : (
          "¡Nivel máximo! Eres leyenda."
        )}
      </p>

      <details className={styles.details}>
        <summary>¿Cómo gano puntos?</summary>
        <ul className={styles.breakdown}>
          {stats.breakdown.map((row) => (
            <li key={row.label}>
              <span>
                {row.label} <span className={styles.count}>×{row.count}</span>
              </span>
              <strong>{row.points} pts</strong>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
