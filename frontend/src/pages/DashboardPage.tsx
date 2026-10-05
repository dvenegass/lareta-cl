import { CalendarCheck, CalendarDays, Plus, Sparkles, TriangleAlert } from "lucide-react";

import { EventListCard } from "../components/dashboard/EventListCard";
import { NextEventCard } from "../components/dashboard/NextEventCard";
import { StatsStrip, type Stat } from "../components/dashboard/StatsStrip";
import { WeekAgenda } from "../components/dashboard/WeekAgenda";
import { WhatToDo } from "../components/fun/WhatToDo";
import { PageHeader } from "../components/layout/PageHeader";
import { ButtonLink } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const { user } = useAuth();
  const { upcoming, created, stats, summary, nextEvent } = useDashboard();
  const level = stats.data?.level;

  const statItems: Stat[] = [
    {
      label: "Próximas juntas",
      value: summary.upcoming,
      hint: `${summary.thisWeek} esta semana`,
      icon: CalendarDays,
    },
    {
      label: "Vas a ir",
      value: summary.going,
      hint: summary.going ? "confirmadas" : "ninguna aún",
      icon: CalendarCheck,
      tone: summary.going ? "positive" : "neutral",
    },
    {
      label: "Por responder",
      value: summary.pending,
      hint: summary.pending ? "te esperan" : "al día",
      icon: TriangleAlert,
      tone: summary.pending ? "attention" : "positive",
    },
    {
      label: "Tus puntos",
      value: stats.data?.points ?? "–",
      hint: level ? `Nivel ${level.number} · ${level.name}` : "…",
      icon: Sparkles,
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Inicio"
        subtitle={`Hola, ${user?.username}. Esto es lo que se viene con tus amigos.`}
        actions={
          // En móvil sobra: la barra de pestañas ya tiene el botón "+".
          <ButtonLink to="/events/new" icon={<Plus />} className={styles.headerCta}>
            Nueva junta
          </ButtonLink>
        }
      />

      <StatsStrip stats={statItems} />

      <div className={styles.grid}>
        <div className={[styles.column, styles.mainColumn].join(" ")}>
          <div className={styles.next}>
            {!upcoming.isLoading && <NextEventCard event={nextEvent} />}
          </div>
          <div className={styles.list}>
            <EventListCard
              upcoming={upcoming.events}
              created={created.events}
              isLoading={upcoming.isLoading || created.isLoading}
            />
          </div>
        </div>

        <div className={[styles.column, styles.sideColumn].join(" ")}>
          <div className={styles.agenda}>
            <WeekAgenda events={upcoming.events} />
          </div>
          <div className={styles.fun}>
            <WhatToDo />
          </div>
        </div>
      </div>
    </div>
  );
}
