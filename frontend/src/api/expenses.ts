import type { ExpenseInput, ExpenseSummary } from "../types";
import { request } from "./client";

export const getExpenses = (eventId: string) => request<ExpenseSummary>(`/events/${eventId}/expenses/`);

export const addExpense = (eventId: string, data: ExpenseInput) =>
  request<ExpenseSummary>(`/events/${eventId}/expenses/`, { method: "POST", body: data });

export const deleteExpense = (expenseId: number) =>
  request<ExpenseSummary>(`/expenses/${expenseId}/`, { method: "DELETE" });
