import { ArrowLeft, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { listGroupEvents } from "../api/events";
import { listFriends } from "../api/friends";
import { GroupChat } from "../components/groups/GroupChat";
import { GroupEditForm } from "../components/groups/GroupEditForm";
import { GroupEventsCard } from "../components/groups/GroupEventsCard";
import { GroupMembersCard } from "../components/groups/GroupMembersCard";
import { GroupPhoto } from "../components/groups/GroupPhoto";
import { Button, ButtonLink } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SkeletonPage } from "../components/ui/Skeleton";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";
import { useGroup } from "../hooks/useGroup";
import styles from "./GroupDetailPage.module.css";

export function GroupDetailPage() {
  const groupId = Number(useParams().id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    group,
    isLoading,
    error,
    actionError,
    update,
    changePhoto,
    removePhoto,
    addMembers,
    removeMember,
    leave,
    remove,
  } = useGroup(groupId);
  const events = useFetch(() => listGroupEvents(groupId), [groupId]);
  const { data: friends } = useFetch(listFriends, []);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) return <SkeletonPage />;
  if (error || !group) {
    return (
      <StatusMessage tone="error" title="Este grupo no existe o no eres miembro.">
        <ButtonLink to="/groups" variant="secondary">
          Ver mis grupos
        </ButtonLink>
      </StatusMessage>
    );
  }

  async function handleLeave() {
    const warning = group!.is_owner ? " Otra persona pasará a administrarlo." : "";
    if (!window.confirm(`¿Salir de «${group!.name}»?${warning}`)) return;
    if (await leave(user!.id)) navigate("/groups", { replace: true });
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar «${group!.name}»? Sus juntas no se borran.`)) return;
    if (await remove()) navigate("/groups", { replace: true });
  }

  return (
    <div className={styles.page}>
      <Link to="/groups" className={styles.back}>
        <ArrowLeft aria-hidden /> Grupos
      </Link>

      <Card className={styles.header}>
        <GroupPhoto group={group} onChange={changePhoto} onRemove={removePhoto} />

        <div className={styles.headerBody}>
          {isEditing ? (
            <GroupEditForm initial={group} onSubmit={update} onCancel={() => setIsEditing(false)} />
          ) : (
            <>
              <div>
                <h1 className={styles.title}>{group.name}</h1>
                {group.description && <p className={styles.description}>{group.description}</p>}
              </div>
              <div className={styles.actions}>
                <ButtonLink to={`/events/new?group=${group.id}`} icon={<Plus />}>
                  Nueva junta
                </ButtonLink>
                {group.is_owner && (
                  <Button variant="secondary" icon={<Pencil />} onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                )}
                <Button variant="ghost" icon={<LogOut />} onClick={handleLeave}>
                  Salir
                </Button>
                {group.is_owner && (
                  <Button variant="danger" icon={<Trash2 />} onClick={handleDelete}>
                    Eliminar
                  </Button>
                )}
              </div>
            </>
          )}
          {actionError && <p className={styles.error}>{actionError}</p>}
        </div>
      </Card>

      {/* Chat en la columna ancha; juntas y miembros en la lateral */}
      <div className={styles.layout}>
        <div className={styles.chat}>
          <GroupChat groupId={group.id} currentUserId={user!.id} />
        </div>

        <aside className={styles.aside}>
          <div className={styles.events}>
            <GroupEventsCard
              events={events.data ?? []}
              isLoading={events.isLoading}
              hasError={Boolean(events.error)}
            />
          </div>
          <div className={styles.members}>
            <GroupMembersCard
              group={group}
              friends={friends ?? []}
              currentUserId={user!.id}
              onAdd={addMembers}
              onRemove={removeMember}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
