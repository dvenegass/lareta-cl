import { useState } from "react";

import * as bringApi from "../api/bringlist";
import { ApiError } from "../api/client";
import type { BringItem } from "../types";
import { useFetch } from "./useFetch";

/** Lista de "qué llevar" de una junta y sus acciones. */
export function useBringList(eventId: string) {
  const { data, setData, isLoading } = useFetch(() => bringApi.listItems(eventId), [eventId]);
  const [actionError, setActionError] = useState<string | null>(null);

  /** El backend devuelve la lista completa; se reemplaza tal cual. Devuelve true si salió bien. */
  async function run(action: () => Promise<BringItem[]>) {
    setActionError(null);
    try {
      setData(await action());
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo guardar.");
      return false;
    }
  }

  return {
    items: data ?? [],
    isLoading,
    actionError,
    add: (name: string) => run(() => bringApi.addItem(eventId, name)),
    claim: (itemId: number) => run(() => bringApi.setItemClaim(itemId, true)),
    release: (itemId: number) => run(() => bringApi.setItemClaim(itemId, false)),
    remove: (itemId: number) => run(() => bringApi.deleteItem(itemId)),
  };
}
