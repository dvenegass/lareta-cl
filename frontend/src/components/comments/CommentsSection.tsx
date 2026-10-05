import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";

import { useComments } from "../../hooks/useComments";
import { timeAgo } from "../../utils/dates";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { UserLink } from "../ui/UserLink";
import styles from "./CommentsSection.module.css";

type CommentsSectionProps = {
  eventId: string;
  /** false = solo leer (junta de un grupo del que no eres miembro). */
  canParticipate: boolean;
};

/** Hilo de la junta: "voy atrasado", "¿alguien me lleva?"… */
export function CommentsSection({ eventId, canParticipate }: CommentsSectionProps) {
  const { comments, isLoading, actionError, add, remove } = useComments(eventId);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!body.trim() || isSending) return;
    setIsSending(true);
    if (await add(body.trim())) setBody("");
    setIsSending(false);
  }

  // Enter envía; Shift+Enter hace un salto de línea.
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <Card className={styles.section}>
      <h2 className={styles.title}>
        <MessageSquare aria-hidden /> Comentarios
        {comments.length > 0 && <span className={styles.count}>{comments.length}</span>}
      </h2>

      {!isLoading && comments.length === 0 && (
        <p className={styles.empty}>
          {canParticipate ? "¿Vas atrasado o necesitas que te lleven? Avisa aquí." : "Todavía no hay comentarios."}
        </p>
      )}

      {comments.length > 0 && (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.comment}>
              <UserLink username={comment.author.username}>
                <Avatar user={comment.author} size={32} />
              </UserLink>
              <div className={styles.bubble}>
                <div className={styles.meta}>
                  <UserLink username={comment.author.username} className={styles.author}>
                    {comment.author.username}
                  </UserLink>
                  <span className={styles.time}>{timeAgo(comment.created_at)}</span>
                  {comment.can_delete && (
                    <button
                      type="button"
                      className={styles.delete}
                      onClick={() => window.confirm("¿Borrar este comentario?") && remove(comment.id)}
                      aria-label="Borrar comentario"
                    >
                      <Trash2 aria-hidden />
                    </button>
                  )}
                </div>
                <p className={styles.body}>{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canParticipate && (
        <form className={styles.form} onSubmit={send}>
          <textarea
            className={styles.input}
            placeholder="Escribe un comentario…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={1000}
            aria-label="Comentario"
          />
          <Button type="submit" icon={<Send />} disabled={!body.trim() || isSending} aria-label="Enviar">
            Enviar
          </Button>
        </form>
      )}
      {actionError && <p className={styles.error}>{actionError}</p>}
    </Card>
  );
}
