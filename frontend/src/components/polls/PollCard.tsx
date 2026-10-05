import { Check, Trash2 } from "lucide-react";

import type { Poll } from "../../types";
import styles from "./PollCard.module.css";

type PollCardProps = {
  poll: Poll;
  onVote: (optionId: number) => void;
  onDelete: () => void;
  /** false = solo se ven los resultados (p. ej. no eres del grupo). */
  canVote?: boolean;
};

export function PollCard({ poll, onVote, onDelete, canVote = true }: PollCardProps) {
  const maxVotes = Math.max(...poll.options.map((option) => option.votes));

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.question}>{poll.question}</h3>
          <p className={styles.meta}>
            por {poll.created_by.username} · {poll.total_votes} {poll.total_votes === 1 ? "voto" : "votos"}
          </p>
        </div>
        {poll.can_delete && (
          <button type="button" className={styles.delete} onClick={onDelete} aria-label="Borrar votación">
            <Trash2 aria-hidden />
          </button>
        )}
      </header>

      <ul className={styles.options}>
        {poll.options.map((option) => {
          const percent = poll.total_votes ? Math.round((option.votes / poll.total_votes) * 100) : 0;
          const isMine = poll.my_vote === option.id;
          const isLeading = option.votes > 0 && option.votes === maxVotes;
          return (
            <li key={option.id}>
              <button
                type="button"
                className={[styles.option, isMine && styles.mine].filter(Boolean).join(" ")}
                onClick={() => onVote(option.id)}
                aria-pressed={isMine}
                disabled={!canVote}
              >
                <span
                  className={[styles.bar, isLeading && styles.leading].filter(Boolean).join(" ")}
                  style={{ width: `${percent}%` }}
                  aria-hidden
                />
                <span className={styles.text}>
                  {isMine && <Check aria-hidden />}
                  {option.text}
                </span>
                <span className={styles.count}>{option.votes}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
