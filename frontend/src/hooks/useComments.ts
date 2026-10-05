import { useState } from "react";

import { ApiError } from "../api/client";
import * as commentsApi from "../api/comments";
import { useFetch } from "./useFetch";

/** Comentarios de una junta. */
export function useComments(eventId: string) {
  const { data, setData, isLoading } = useFetch(() => commentsApi.listComments(eventId), [eventId]);
  const [actionError, setActionError] = useState<string | null>(null);
  const comments = data ?? [];

  async function add(body: string) {
    setActionError(null);
    try {
      const comment = await commentsApi.addComment(eventId, body);
      setData([...comments, comment]);
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo enviar.");
      return false;
    }
  }

  async function remove(commentId: number) {
    setActionError(null);
    try {
      await commentsApi.deleteComment(commentId);
      setData(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo borrar.");
    }
  }

  return { comments, isLoading, actionError, add, remove };
}
