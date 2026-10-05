import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import styles from "./PollForm.module.css";

const MAX_OPTIONS = 8;
const PLACEHOLDERS = ["Casa de Diego", "Pizza", "Gaming Center", "McDonald's"];

type PollFormProps = {
  onSubmit: (question: string, options: string[]) => Promise<boolean>;
  onCancel: () => void;
};

export function PollForm({ onSubmit, onCancel }: PollFormProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setOption = (index: number, value: string) =>
    setOptions((current) => current.map((option, i) => (i === index ? value : option)));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const ok = await onSubmit(question.trim(), options);
    setIsSubmitting(false);
    if (ok) onCancel(); // cierra el formulario
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        label="Pregunta"
        placeholder="¿Dónde hacemos la junta?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        maxLength={200}
        required
        autoFocus
      />

      <div className={styles.options}>
        <span className={styles.label}>Opciones</span>
        {options.map((option, index) => (
          <div key={index} className={styles.optionRow}>
            <input
              className={styles.optionInput}
              placeholder={PLACEHOLDERS[index] ?? `Opción ${index + 1}`}
              value={option}
              onChange={(e) => setOption(index, e.target.value)}
              maxLength={100}
              aria-label={`Opción ${index + 1}`}
            />
            {options.length > 2 && (
              <button
                type="button"
                className={styles.remove}
                onClick={() => setOptions(options.filter((_, i) => i !== index))}
                aria-label={`Quitar opción ${index + 1}`}
              >
                <X aria-hidden />
              </button>
            )}
          </div>
        ))}
        {options.length < MAX_OPTIONS && (
          <Button variant="ghost" icon={<Plus />} onClick={() => setOptions([...options, ""])}>
            Agregar opción
          </Button>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando…" : "Crear votación"}
        </Button>
      </div>
    </form>
  );
}
