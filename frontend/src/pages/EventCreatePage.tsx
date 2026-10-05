import { useNavigate, useSearchParams } from "react-router";

import { createEvent } from "../api/events";
import { listGroups } from "../api/groups";
import { EventForm } from "../components/events/EventForm";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { useFetch } from "../hooks/useFetch";
import type { EventInput } from "../types";
import styles from "./EventFormPage.module.css";

export function EventCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: groups } = useFetch(listGroups, []);
  const groupParam = searchParams.get("group");

  async function handleSubmit(data: EventInput) {
    const event = await createEvent(data);
    navigate(`/events/${event.id}`, { state: { justCreated: true } });
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Nueva junta" subtitle="Lo justo y necesario. Lo demás se conversa." />
      <Card>
        <EventForm
          defaultTitle={searchParams.get("title") ?? ""}
          defaultGroupId={groupParam ? Number(groupParam) : null}
          groups={groups ?? []}
          submitLabel="Crear junta"
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
        />
      </Card>
    </div>
  );
}
