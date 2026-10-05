import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { ApiError } from "../api/client";
import { listFriends } from "../api/friends";
import { createGroup } from "../api/groups";
import { FriendPicker } from "../components/groups/FriendPicker";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextField } from "../components/ui/TextField";
import { useFetch } from "../hooks/useFetch";
import styles from "./GroupCreatePage.module.css";

export function GroupCreatePage() {
  const navigate = useNavigate();
  const { data: friends } = useFetch(listFriends, []);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const group = await createGroup({ name: name.trim(), description: description.trim(), member_ids: memberIds });
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.fieldErrors : { detail: "No se pudo crear el grupo." });
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Nuevo grupo" subtitle="Ponle nombre y suma a tus amigos." />
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          <TextField
            label="Nombre"
            placeholder="Chilensios"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            maxLength={60}
            required
            autoFocus
          />
          <TextField
            label="Descripción"
            hint="Opcional"
            placeholder="Los de siempre"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            maxLength={200}
          />

          <div className={styles.members}>
            <span className={styles.label}>Miembros</span>
            {friends && friends.length > 0 ? (
              <FriendPicker friends={friends} selected={memberIds} onChange={setMemberIds} />
            ) : (
              <p className={styles.hint}>
                Todavía no tienes amigos. <Link to="/friends">Agrégalos</Link> y luego súmalos al grupo.
              </p>
            )}
            {errors.member_ids && <p className={styles.error}>{errors.member_ids}</p>}
          </div>

          {errors.detail && <p className={styles.error}>{errors.detail}</p>}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => navigate("/groups")} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear grupo"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
