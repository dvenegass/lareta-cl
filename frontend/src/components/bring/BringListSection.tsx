import { Check, Hand, ListChecks, Plus, Trash2, Undo2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useBringList } from "../../hooks/useBringList";
import type { BringItem } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import styles from "./BringListSection.module.css";

type BringListSectionProps = {
  eventId: string;
  currentUserId: number;
  /** false = solo ver (junta de un grupo del que no eres miembro). */
  canParticipate: boolean;
};

/** Lista de "qué llevar": cada uno marca lo que lleva. */
export function BringListSection({ eventId, currentUserId, canParticipate }: BringListSectionProps) {
  const { items, isLoading, actionError, add, claim, release, remove } = useBringList(eventId);
  const [name, setName] = useState("");
  const covered = items.filter((item) => item.assigned_to).length;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await add(name.trim())) setName("");
  }

  function itemAction(item: BringItem) {
    if (!canParticipate) return null;
    if (!item.assigned_to) {
      return (
        <Button variant="secondary" icon={<Hand />} onClick={() => claim(item.id)}>
          Yo lo llevo
        </Button>
      );
    }
    if (item.can_release) {
      return (
        <Button
          variant="ghost"
          icon={<Undo2 />}
          onClick={() => release(item.id)}
          aria-label={item.assigned_to.id === currentUserId ? "Ya no lo llevo" : "Liberar"}
        >
          {item.assigned_to.id === currentUserId ? "Ya no" : "Liberar"}
        </Button>
      );
    }
    return null;
  }

  return (
    <Card className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <ListChecks aria-hidden /> Qué llevar
        </h2>
        {items.length > 0 && (
          <span className={styles.progress}>
            {covered}/{items.length} cubiertos
          </span>
        )}
      </div>

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>
          {canParticipate ? "Agrega lo que haga falta: carbón, hielo, bebidas…" : "Todavía no hay nada en la lista."}
        </p>
      )}

      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={[styles.item, item.assigned_to && styles.covered].filter(Boolean).join(" ")}>
              <span className={styles.check} aria-hidden>
                {item.assigned_to && <Check />}
              </span>
              <span className={styles.text}>
                <strong>{item.name}</strong>
                {item.assigned_to ? (
                  <span className={styles.who}>
                    <Avatar user={item.assigned_to} size={18} />
                    {item.assigned_to.id === currentUserId ? "Lo llevas tú" : `Lo lleva ${item.assigned_to.username}`}
                  </span>
                ) : (
                  <span className={styles.who}>Nadie todavía</span>
                )}
              </span>
              <span className={styles.actions}>
                {itemAction(item)}
                {item.can_delete && (
                  <button
                    type="button"
                    className={styles.delete}
                    onClick={() => remove(item.id)}
                    aria-label={`Quitar ${item.name}`}
                  >
                    <Trash2 aria-hidden />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canParticipate && (
        <form className={styles.form} onSubmit={handleAdd}>
          <input
            className={styles.input}
            placeholder="Agregar algo (ej: Carbón)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            aria-label="Qué hay que llevar"
          />
          <Button type="submit" icon={<Plus />} disabled={!name.trim()}>
            Agregar
          </Button>
        </form>
      )}
      {actionError && <p className={styles.error}>{actionError}</p>}
    </Card>
  );
}
