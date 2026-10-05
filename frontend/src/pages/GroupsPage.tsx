import { Plus, UsersRound } from "lucide-react";

import { listGroups } from "../api/groups";
import { GroupCard } from "../components/groups/GroupCard";
import { PageHeader } from "../components/layout/PageHeader";
import { ButtonLink } from "../components/ui/Button";
import { SkeletonCards } from "../components/ui/Skeleton";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useFetch } from "../hooks/useFetch";
import styles from "./GroupsPage.module.css";

export function GroupsPage() {
  const { data: groups, isLoading, error } = useFetch(listGroups, []);

  return (
    <>
      <PageHeader
        title="Grupos"
        subtitle="Las juntas de tus grupos aparecen en tu feed."
        actions={
          <ButtonLink to="/groups/new" icon={<Plus />}>
            Nuevo grupo
          </ButtonLink>
        }
      />

      {isLoading ? (
        <SkeletonCards label="Cargando grupos…" />
      ) : error || !groups ? (
        <StatusMessage tone="error" title="No pudimos cargar tus grupos." />
      ) : groups.length === 0 ? (
        <StatusMessage icon={<UsersRound />} title="Todavía no estás en ningún grupo">
          <p>Crea uno con tus amigos, como «Los del colegio» o «Chilensios».</p>
          <ButtonLink to="/groups/new" icon={<Plus />}>
            Crear un grupo
          </ButtonLink>
        </StatusMessage>
      ) : (
        <div className={styles.grid}>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </>
  );
}
