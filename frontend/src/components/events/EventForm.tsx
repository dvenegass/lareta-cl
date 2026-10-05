import { useState, type FormEvent } from "react";

import { ApiError } from "../../api/client";
import type { EventInput, GroupRef, MoneyMode } from "../../types";
import { toDateInput, toIsoDateTime, toTimeInput } from "../../utils/dates";
import { Button } from "../ui/Button";
import { SelectField, TextArea, TextField } from "../ui/TextField";
import { BringItemsInput } from "./BringItemsInput";
import styles from "./EventForm.module.css";
import { EventSectionsField, type EventSections } from "./EventSectionsField";
import { MoneyModeField } from "./MoneyModeField";

type EventFormProps = {
  /** Valores iniciales al editar; vacío al crear. */
  initial?: EventInput;
  /** Nombre sugerido al crear (p. ej. desde "¿Qué hacemos?"). */
  defaultTitle?: string;
  /** Grupo preseleccionado al crear (p. ej. desde la página del grupo). */
  defaultGroupId?: number | null;
  /** Grupos del usuario, para elegir dónde se publica la junta. */
  groups: GroupRef[];
  submitLabel: string;
  onSubmit: (data: EventInput) => Promise<void>;
  onCancel: () => void;
};

function initialState(initial?: EventInput, defaultTitle = "", defaultGroupId: number | null = null) {
  if (!initial) {
    return {
      title: defaultTitle,
      date: "",
      time: "20:00",
      location: "",
      description: "",
      group: defaultGroupId ? String(defaultGroupId) : "",
      moneyMode: "none" as MoneyMode,
      feeAmount: "",
    };
  }
  const startsAt = new Date(initial.starts_at);
  return {
    title: initial.title,
    date: toDateInput(startsAt),
    time: toTimeInput(startsAt),
    location: initial.location,
    description: initial.description,
    group: initial.group ? String(initial.group) : "",
    moneyMode: initial.money_mode,
    feeAmount: initial.fee_amount ? String(initial.fee_amount) : "",
  };
}

export function EventForm({
  initial,
  defaultTitle,
  defaultGroupId,
  groups,
  submitLabel,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const isCreating = !initial;
  const [values, setValues] = useState(() => initialState(initial, defaultTitle, defaultGroupId));
  const [sections, setSections] = useState<EventSections>(() => ({
    bringListEnabled: initial?.bring_list_enabled ?? true,
    pollsEnabled: initial?.polls_enabled ?? true,
    commentsEnabled: initial?.comments_enabled ?? true,
  }));
  // Lista inicial de "qué llevar" (solo al crear; después se maneja desde la junta).
  const [bringItems, setBringItems] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        starts_at: toIsoDateTime(values.date, values.time),
        group: values.group ? Number(values.group) : null,
        money_mode: values.moneyMode,
        fee_amount: values.moneyMode === "fixed" ? Number(values.feeAmount) || null : null,
        bring_list_enabled: sections.bringListEnabled,
        polls_enabled: sections.pollsEnabled,
        comments_enabled: sections.commentsEnabled,
        ...(isCreating && sections.bringListEnabled ? { bring_items: bringItems } : {}),
      });
    } catch (err) {
      setErrors(err instanceof ApiError ? err.fieldErrors : { detail: "Algo salió mal." });
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        label="Nombre"
        placeholder="Junta de fin de mes"
        value={values.title}
        onChange={update("title")}
        error={errors.title}
        maxLength={120}
        required
        autoFocus
      />

      <div className={styles.row}>
        <TextField
          label="Fecha"
          type="date"
          value={values.date}
          onChange={update("date")}
          error={errors.starts_at}
          min={initial ? undefined : toDateInput(new Date())}
          required
        />
        <TextField label="Hora" type="time" value={values.time} onChange={update("time")} required />
      </div>

      <TextField
        label="Lugar"
        placeholder="Casa de Diego"
        value={values.location}
        onChange={update("location")}
        error={errors.location}
        maxLength={200}
        required
      />

      <TextArea
        label="Descripción"
        hint="Opcional: qué llevar, a qué hora llegar…"
        value={values.description}
        onChange={update("description")}
        error={errors.description}
      />

      <SelectField
        label="¿Para quién es?"
        hint={
          values.group
            ? "Sale en el feed del grupo. Cualquiera con el enlace la ve, pero solo los miembros pueden unirse."
            : "Solo la verá quien tenga el enlace."
        }
        value={values.group}
        onChange={update("group")}
        error={errors.group}
      >
        <option value="">Solo por enlace</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            Grupo: {group.name}
          </option>
        ))}
      </SelectField>

      <MoneyModeField
        mode={values.moneyMode}
        feeAmount={values.feeAmount}
        feeError={errors.fee_amount}
        onModeChange={(moneyMode) => setValues((current) => ({ ...current, moneyMode }))}
        onFeeChange={(feeAmount) => setValues((current) => ({ ...current, feeAmount }))}
      />

      <EventSectionsField
        value={sections}
        onChange={setSections}
        bringListExtra={isCreating && <BringItemsInput items={bringItems} onChange={setBringItems} />}
      />
      {errors.bring_items && <p className={styles.error}>{errors.bring_items}</p>}

      {errors.detail && <p className={styles.error}>{errors.detail}</p>}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
