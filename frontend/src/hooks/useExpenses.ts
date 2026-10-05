import { useState } from "react";

import { ApiError } from "../api/client";
import * as expensesApi from "../api/expenses";
import type { ExpenseInput } from "../types";
import { useFetch } from "./useFetch";

/**
 * Gastos compartidos de una junta.
 * `goingCount` recarga el resumen cuando cambia cuánta gente divide la cuenta.
 */
export function useExpenses(eventId: string, goingCount: number) {
  const { data: summary, setData, isLoading, error } = useFetch(
    () => expensesApi.getExpenses(eventId),
    [eventId, goingCount],
  );
  const [actionError, setActionError] = useState<string | null>(null);

  /** Devuelve true si se guardó (el formulario lo usa para limpiarse). */
  async function add(data: ExpenseInput) {
    setActionError(null);
    try {
      setData(await expensesApi.addExpense(eventId, data));
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo guardar el gasto.");
      return false;
    }
  }

  async function remove(expenseId: number) {
    setActionError(null);
    try {
      setData(await expensesApi.deleteExpense(expenseId));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo borrar el gasto.");
    }
  }

  return { summary, isLoading, error, actionError, add, remove };
}
