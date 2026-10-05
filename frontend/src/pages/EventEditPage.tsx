import { useNavigate, useParams } from "react-router";

import { getEvent, updateEvent } from "../api/events";
import { listGroups } from "../api/groups";
import { EventForm } from "../components/events/EventForm";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { SkeletonPage } from "../components/ui/Skeleton";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useFetch } from "../hooks/useFetch";
import type { EventInput } from "../types";
import styles from "./EventFormPage.module.css";

export function EventEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useFetch(() => getEvent(id), [id]);
  const { data: groups } = useFetch(listGroups, []);

  if (isLoading) return <SkeletonPage />;
  if (error || !event) return <StatusMessage tone="error" title="No encontramos esta junta." />;
  if (!event.is_creator) return <StatusMessage tone="error" title="Solo quien creó la junta puede editarla." />;

  async function handleSubmit(data: EventInput) {
    await updateEvent(id, data);
    navigate(`/events/${id}`);
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Editar junta" />
      <Card>
        <EventForm
          initial={{ ...event, group: event.group?.id ?? null }}
          groups={groups ?? []}
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/events/${id}`)}
        />
      </Card>
    </div>
  );
}
