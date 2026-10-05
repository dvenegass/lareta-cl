import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { ExpenseInput, User } from "../../types";
import { Button } from "../ui/Button";
import styles from "./MoneyPanels.module.css";

type ExpenseFormProps = {
  payers: User[];
  defaultPayerId: number;
  onSubmit: (data: ExpenseInput) => Promise<boolean>;
};

export function ExpenseForm({ payers, defaultPayerId, onSubmit }: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState(defaultPayerId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const ok = await onSubmit({ description: description.trim(), amount: Number(amount), paid_by: payerId });
    setIsSubmitting(false);
    if (ok) {
      setDescription("");
      setAmount("");
    }
  }

  return (
    <form className={styles.expenseForm} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="¿Qué se compró? (ej: Pizzas)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={120}
        aria-label="Descripción del gasto"
        required
      />
      <input
        className={styles.input}
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        aria-label="Monto"
        required
      />
      <select
        className={styles.input}
        value={payerId}
        onChange={(e) => setPayerId(Number(e.target.value))}
        aria-label="Quién pagó"
      >
        {payers.map((payer) => (
          <option key={payer.id} value={payer.id}>
            Pagó {payer.username}
          </option>
        ))}
      </select>
      <Button type="submit" icon={<Plus />} disabled={isSubmitting}>
        Anotar
      </Button>
    </form>
  );
}
