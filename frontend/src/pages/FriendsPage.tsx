import { Check, UserMinus, Users, X } from "lucide-react";

import { UserSearch } from "../components/friends/UserSearch";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SkeletonRows } from "../components/ui/Skeleton";
import { StatusMessage } from "../components/ui/StatusMessage";
import { UserList, UserRow } from "../components/ui/UserRow";
import { useFriends } from "../hooks/useFriends";
import styles from "./FriendsPage.module.css";

export function FriendsPage() {
  const { friends, incoming, outgoing, isLoading, actionError, sendRequest, accept, decline, remove } =
    useFriends();

  function handleRemove(userId: number, username: string) {
    if (window.confirm(`¿Eliminar a ${username} de tus amigos?`)) remove(userId);
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Amigos" subtitle="Agrega a tus amigos para armar grupos y competir en los rankings." />

      {actionError && <p className={styles.error}>{actionError}</p>}

      <Card className={styles.section}>
        <h2 className={styles.title}>Agregar amigos</h2>
        <UserSearch onAdd={sendRequest} />
      </Card>

      {incoming.length > 0 && (
        <Card className={styles.section}>
          <h2 className={styles.title}>
            Solicitudes <span className={styles.count}>{incoming.length}</span>
          </h2>
          <UserList>
            {incoming.map((request) => (
              <UserRow
                key={request.id}
                user={request.user}
                detail="Quiere ser tu amigo"
                actions={
                  <>
                    <Button icon={<Check />} onClick={() => accept(request.id)}>
                      Aceptar
                    </Button>
                    <Button variant="ghost" icon={<X />} onClick={() => decline(request.id)} aria-label="Rechazar">
                      Rechazar
                    </Button>
                  </>
                }
              />
            ))}
          </UserList>
        </Card>
      )}

      <Card className={styles.section}>
        <h2 className={styles.title}>
          Tus amigos {!isLoading && <span className={styles.count}>{friends.length}</span>}
        </h2>
        {isLoading ? (
          <SkeletonRows label="Cargando amigos…" />
        ) : friends.length === 0 ? (
          <StatusMessage icon={<Users />} title="Todavía no tienes amigos agregados">
            <p>Búscalos arriba por su nombre de usuario.</p>
          </StatusMessage>
        ) : (
          <UserList>
            {friends.map((friend) => (
              <UserRow
                key={friend.id}
                user={friend}
                actions={
                  <Button
                    variant="ghost"
                    icon={<UserMinus />}
                    onClick={() => handleRemove(friend.id, friend.username)}
                    aria-label={`Eliminar a ${friend.username}`}
                  />
                }
              />
            ))}
          </UserList>
        )}
      </Card>

      {outgoing.length > 0 && (
        <Card className={styles.section}>
          <h2 className={styles.title}>Solicitudes enviadas</h2>
          <UserList>
            {outgoing.map((request) => (
              <UserRow
                key={request.id}
                user={request.user}
                detail="Esperando respuesta"
                actions={
                  <Button variant="ghost" onClick={() => decline(request.id)}>
                    Cancelar
                  </Button>
                }
              />
            ))}
          </UserList>
        </Card>
      )}
    </div>
  );
}
