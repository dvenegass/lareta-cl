import { Plus, Vote } from "lucide-react";
import { useState } from "react";

import { usePolls } from "../../hooks/usePolls";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { PollCard } from "./PollCard";
import { PollForm } from "./PollForm";
import styles from "./PollsSection.module.css";

type PollsSectionProps = {
  eventId: string;
  /** false = solo ver (la junta es de un grupo del que no eres miembro). */
  canParticipate?: boolean;
};

export function PollsSection({ eventId, canParticipate = true }: PollsSectionProps) {
  const { polls, isLoading, actionError, create, vote, remove } = usePolls(eventId);
  const [isCreating, setIsCreating] = useState(false);

  function handleDelete(pollId: number) {
    if (window.confirm("¿Borrar esta votación?")) remove(pollId);
  }

  return (
    <Card className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Vote aria-hidden /> Votaciones
        </h2>
        {canParticipate && !isCreating && (
          <Button variant="secondary" icon={<Plus />} onClick={() => setIsCreating(true)}>
            Nueva
          </Button>
        )}
      </div>

      {isCreating && <PollForm onSubmit={create} onCancel={() => setIsCreating(false)} />}
      {actionError && <p className={styles.error}>{actionError}</p>}

      {!isLoading && polls.length === 0 && !isCreating && (
        <p className={styles.empty}>
          {canParticipate ? "¿No se ponen de acuerdo? Creen una votación." : "Todavía no hay votaciones."}
        </p>
      )}

      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          canVote={canParticipate}
          onVote={(optionId) => vote(poll, optionId)}
          onDelete={() => handleDelete(poll.id)}
        />
      ))}
    </Card>
  );
}
