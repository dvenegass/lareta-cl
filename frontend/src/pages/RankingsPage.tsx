import { useState } from "react";

import { listGroups } from "../api/groups";
import { getMyStats, getRankings } from "../api/stats";
import { PageHeader } from "../components/layout/PageHeader";
import { LevelCard } from "../components/stats/LevelCard";
import { RankingCard } from "../components/stats/RankingCard";
import { Bone, SkeletonCards } from "../components/ui/Skeleton";
import { StatusMessage } from "../components/ui/StatusMessage";
import { SelectField } from "../components/ui/TextField";
import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";
import type { Rankings } from "../types";
import styles from "./RankingsPage.module.css";

function describe(rankings: Rankings) {
  if (rankings.group) return `Entre los ${rankings.people_count} miembros de ${rankings.group.name}.`;
  const friends = rankings.people_count - 1;
  if (friends === 0) return "Agrega amigos para empezar a competir.";
  return friends === 1 ? "Entre tú y tu amigo." : `Entre tú y tus ${friends} amigos.`;
}

export function RankingsPage() {
  const { user } = useAuth();
  const [groupId, setGroupId] = useState(""); // "" = entre amigos
  const myStats = useFetch(getMyStats, []);
  const { data: groups } = useFetch(listGroups, []);
  const rankings = useFetch(() => getRankings(groupId ? Number(groupId) : undefined), [groupId]);

  if (myStats.isLoading) {
    return (
      <>
        <PageHeader title="Rankings" />
        <div className={styles.level}>
          <Bone height={120} shape="block" />
        </div>
        <SkeletonCards count={4} label="Cargando rankings…" />
      </>
    );
  }
  if (!myStats.data) return <StatusMessage tone="error" title="No pudimos cargar tus puntos." />;

  return (
    <>
      <PageHeader title="Rankings" subtitle={rankings.data ? describe(rankings.data) : undefined} />

      <div className={styles.level}>
        <LevelCard stats={myStats.data} />
      </div>

      {groups && groups.length > 0 && (
        <div className={styles.scope}>
          <SelectField label="Ver ranking de" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Mis amigos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                Grupo: {group.name}
              </option>
            ))}
          </SelectField>
        </div>
      )}

      {rankings.isLoading ? (
        <SkeletonCards count={4} label="Calculando rankings…" />
      ) : !rankings.data ? (
        <StatusMessage tone="error" title="No pudimos cargar los rankings." />
      ) : (
        <div className={styles.grid}>
          {rankings.data.rankings.map((ranking) => (
            <RankingCard key={ranking.key} ranking={ranking} currentUserId={user!.id} />
          ))}
        </div>
      )}
    </>
  );
}
