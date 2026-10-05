import { useState, type FormEvent } from "react";

import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import styles from "./GroupEditForm.module.css";

type GroupEditFormProps = {
  initial: { name: string; description: string };
  onSubmit: (data: { name: string; description: string }) => Promise<boolean>;
  onCancel: () => void;
};

export function GroupEditForm({ initial, onSubmit, onCancel }: GroupEditFormProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (await onSubmit({ name: name.trim(), description: description.trim() })) onCancel();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      <TextField
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
      />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}
