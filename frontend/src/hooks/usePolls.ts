import { useState } from "react";

import { ApiError } from "../api/client";
import * as pollsApi from "../api/polls";
import type { Poll } from "../types";
import { useFetch } from "./useFetch";

/** Votaciones de una junta y sus acciones. */
export function usePolls(eventId: string) {
  const { data, setData, isLoading, error } = useFetch(() => pollsApi.listPolls(eventId), [eventId]);
  const [actionError, setActionError] = useState<string | null>(null);
  const polls = data ?? [];

  const replace = (updated: Poll) => setData(polls.map((poll) => (poll.id === updated.id ? updated : poll)));

  /** Devuelve true si salió bien (el formulario lo usa para limpiarse). */
  async function run(action: () => Promise<void>) {
    setActionError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo guardar.");
      return false;
    }
  }

  return {
    polls,
    isLoading,
    error,
    actionError,
    create: (question: string, options: string[]) =>
      run(async () => setData([...polls, await pollsApi.createPoll(eventId, { question, options })])),
    vote: (poll: Poll, optionId: number) =>
      run(async () =>
        // Pulsar la opción ya votada quita el voto.
        replace(poll.my_vote === optionId ? await pollsApi.removeVote(poll.id) : await pollsApi.vote(poll.id, optionId)),
      ),
    remove: (pollId: number) =>
      run(async () => {
        await pollsApi.deletePoll(pollId);
        setData(polls.filter((poll) => poll.id !== pollId));
      }),
  };
}
