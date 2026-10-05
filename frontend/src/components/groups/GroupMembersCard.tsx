import { UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import type { GroupDetail, User } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { UserList, UserRow } from "../ui/UserRow";
import { FriendPicker } from "./FriendPicker";
import styles from "./GroupMembersCard.module.css";

type GroupMembersCardProps = {
  group: GroupDetail;
  friends: User[];
  currentUserId: number;
  onAdd: (userIds: number[]) => Promise<boolean>;
  onRemove: (userId: number) => void;
};

/** Miembros del grupo + agregar amigos (cualquier miembro) + sacar gente (quien administra). */
export function GroupMembersCard({ group, friends, currentUserId, onAdd, onRemove }: GroupMembersCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const memberIds = new Set(group.members.map((m) => m.user.id));
  const addableFriends = friends.filter((friend) => !memberIds.has(friend.id));

  async function handleAdd() {
    if (await onAdd(selected)) {
      setSelected([]);
      setIsAdding(false);
    }
  }

  function handleRemove(user: User) {
    if (window.confirm(`¿Sacar a ${user.username} del grupo?`)) onRemove(user.id);
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Miembros <span className={styles.count}>{group.members.length}</span>
        </h2>
        {!isAdding && (
          <Button variant="secondary" icon={<UserPlus />} onClick={() => setIsAdding(true)}>
            Agregar
          </Button>
        )}
      </div>

      {isAdding && (
        <div className={styles.adding}>
          {addableFriends.length === 0 ? (
            <p className={styles.hint}>
              Todos tus amigos ya están aquí. <Link to="/friends">Agrega más amigos</Link>.
            </p>
          ) : (
            <FriendPicker friends={addableFriends} selected={selected} onChange={setSelected} />
          )}
          <div className={styles.addActions}>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={selected.length === 0}>
              Agregar {selected.length > 0 && `(${selected.length})`}
            </Button>
          </div>
        </div>
      )}

      <UserList>
        {group.members.map(({ user, is_owner }) => (
          <UserRow
            key={user.id}
            user={user}
            detail={is_owner ? "Administra" : user.id === currentUserId ? "Tú" : undefined}
            actions={
              group.is_owner && user.id !== currentUserId ? (
                <Button
                  variant="ghost"
                  icon={<UserMinus />}
                  onClick={() => handleRemove(user)}
                  aria-label={`Sacar a ${user.username}`}
                />
              ) : undefined
            }
          />
        ))}
      </UserList>
    </Card>
  );
}
