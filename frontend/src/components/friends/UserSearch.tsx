import { Check, Clock, Search, UserPlus } from "lucide-react";
import { useState } from "react";

import { searchUsers } from "../../api/friends";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFetch } from "../../hooks/useFetch";
import type { UserSearchResult } from "../../types";
import { Button } from "../ui/Button";
import { UserList, UserRow } from "../ui/UserRow";
import styles from "./UserSearch.module.css";

const MIN_LENGTH = 2;

type UserSearchProps = {
  /** Envía (o acepta) una solicitud. Devuelve true si salió bien. */
  onAdd: (username: string) => Promise<boolean>;
};

function RelationshipAction({ result, onAdd }: { result: UserSearchResult; onAdd: () => void }) {
  switch (result.relationship) {
    case "friends":
      return (
        <span className={styles.status}>
          <Check aria-hidden /> Amigos
        </span>
      );
    case "request_sent":
      return (
        <span className={styles.status}>
          <Clock aria-hidden /> Enviada
        </span>
      );
    case "request_received":
      return (
        <Button icon={<Check />} onClick={onAdd}>
          Aceptar
        </Button>
      );
    default:
      return (
        <Button variant="secondary" icon={<UserPlus />} onClick={onAdd}>
          Agregar
        </Button>
      );
  }
}

/** Buscar personas por nombre de usuario y mandarles solicitud. */
export function UserSearch({ onAdd }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim());
  const isSearching = debounced.length >= MIN_LENGTH;
  const { data, reload } = useFetch(
    () => (isSearching ? searchUsers(debounced) : Promise.resolve([])),
    [debounced],
  );
  const results = data ?? [];

  async function handleAdd(username: string) {
    if (await onAdd(username)) reload(); // actualiza el estado ("Enviada", "Amigos")
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.searchBox}>
        <Search aria-hidden />
        <input
          type="search"
          placeholder="Buscar por nombre de usuario"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar personas"
        />
      </label>

      {isSearching && results.length === 0 && <p className={styles.empty}>Nadie con ese nombre.</p>}
      {results.length > 0 && (
        <UserList>
          {results.map((result) => (
            <UserRow
              key={result.user.id}
              user={result.user}
              actions={<RelationshipAction result={result} onAdd={() => handleAdd(result.user.username)} />}
            />
          ))}
        </UserList>
      )}
    </div>
  );
}
