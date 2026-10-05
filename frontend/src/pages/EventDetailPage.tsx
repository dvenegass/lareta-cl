import { ArrowLeft, CalendarX, PartyPopper, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import { deleteEvent } from "../api/events";
import { AttendeeList } from "../components/events/AttendeeList";
import { CancelEventForm } from "../components/events/CancelEventForm";
import { CancelledNotice } from "../components/events/CancelledNotice";
import { EventMeta } from "../components/events/EventMeta";
import { GroupChip } from "../components/events/GroupChip";
import { MembersOnlyNotice } from "../components/events/MembersOnlyNotice";
import { QuickLinks } from "../components/events/QuickLinks";
import { BringListSection } from "../components/bring/BringListSection";
import { CommentsSection } from "../components/comments/CommentsSection";
import { RsvpButtons } from "../components/events/RsvpButtons";
import { ShareButtons } from "../components/events/ShareButtons";
import { MoneySection } from "../components/money/MoneySection";
import { PhotosSection } from "../components/photos/PhotosSection";
import { PollsSection } from "../components/polls/PollsSection";
import { Avatar } from "../components/ui/Avatar";
import { Button, ButtonLink } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { UserLink } from "../components/ui/UserLink";
import { SkeletonPage } from "../components/ui/Skeleton";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import { useEvent } from "../hooks/useEvent";
import styles from "./EventDetailPage.module.css";

export function EventDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const justCreated = Boolean(location.state?.justCreated);

  const { user } = useAuth();
  const { event, isLoading, error, isSaving, actionError, respond, cancel, reactivate, markParticipant } =
    useEvent(id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (isLoading) return <SkeletonPage />;
  if (error || !event) {
    return (
      <StatusMessage tone="error" title="Esta junta no existe o fue eliminada.">
        <ButtonLink to="/dashboard" variant="secondary">
          Volver al inicio
        </ButtonLink>
      </StatusMessage>
    );
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${event!.title}"? Esta acción no se puede deshacer.`)) return;
    setIsDeleting(true);
    try {
      await deleteEvent(id);
      navigate("/dashboard", { replace: true });
    } catch {
      setIsDeleting(false);
      window.alert("No se pudo eliminar la junta. Inténtalo de nuevo.");
    }
  }

  async function handleCancel(reason: string) {
    await cancel(reason);
    setIsCancelling(false);
  }

  // El álbum se abre cuando la junta empieza (y nunca en una cancelada).
  const showPhotos = event.has_started && !event.is_cancelled;

  return (
    <div className={styles.page}>
      <Link to="/dashboard" className={styles.back}>
        <ArrowLeft aria-hidden /> Mis juntas
      </Link>

      {event.is_cancelled && event.cancelled_at && (
        <CancelledNotice
          cancelledAt={event.cancelled_at}
          reason={event.cancel_reason}
          onReactivate={event.is_creator ? reactivate : undefined}
          disabled={isSaving}
        />
      )}

      {justCreated && (
        <div className={styles.banner} role="status">
          <PartyPopper aria-hidden />
          <p>
            <strong>¡Junta creada!</strong> Copia el enlace y compártelo con tus amigos.
          </p>
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.column}>
          <Card className={[styles.main, styles.orderMain].join(" ")}>
            <div className={styles.header}>
              {event.group && <GroupChip group={event.group} linked={event.can_join} />}
              <h1 className={styles.title}>{event.title}</h1>
              <UserLink username={event.creator.username} className={styles.creator}>
                <Avatar user={event.creator} size={28} />
                <span>
                  Organiza <strong>{event.creator.username}</strong>
                </span>
              </UserLink>
            </div>

            <EventMeta startsAt={event.starts_at} location={event.location} />

            {event.description && <p className={styles.description}>{event.description}</p>}

            <QuickLinks event={event} />

            <div className={styles.actions}>
              <ShareButtons event={event} />
              {event.is_creator && (
                <>
                  <ButtonLink to={`/events/${id}/edit`} variant="secondary" icon={<Pencil />}>
                    Editar
                  </ButtonLink>
                  {!event.is_cancelled && !isCancelling && (
                    <Button variant="ghost" icon={<CalendarX />} onClick={() => setIsCancelling(true)}>
                      Cancelar junta
                    </Button>
                  )}
                  <Button variant="danger" icon={<Trash2 />} onClick={handleDelete} disabled={isDeleting}>
                    Eliminar
                  </Button>
                </>
              )}
            </div>

            {isCancelling && (
              <CancelEventForm
                goingCount={event.going_count}
                onConfirm={handleCancel}
                onBack={() => setIsCancelling(false)}
                disabled={isSaving}
              />
            )}
          </Card>

          {showPhotos && (
            <div className={styles.orderPhotos}>
              <PhotosSection eventId={id} canUpload={event.can_join} />
            </div>
          )}

          <div className={styles.orderMoney}>
            <MoneySection
              event={event}
              currentUserId={user!.id}
              onTogglePaid={(userId, paid) => markParticipant(userId, { fee_paid: paid })}
              disabled={isSaving}
            />
          </div>
          {/* Secciones opcionales: el organizador decide cuáles tiene la junta */}
          {event.bring_list_enabled && (
            <div className={styles.orderBring}>
              <BringListSection eventId={id} currentUserId={user!.id} canParticipate={event.can_join} />
            </div>
          )}
          {event.polls_enabled && (
            <div className={styles.orderPolls}>
              <PollsSection eventId={id} canParticipate={event.can_join} />
            </div>
          )}
          {event.comments_enabled && (
            <div className={styles.orderComments}>
              <CommentsSection eventId={id} canParticipate={event.can_join} />
            </div>
          )}
        </div>

        <div className={styles.column}>
          <Card className={styles.orderRsvp}>
            {event.is_cancelled ? (
              <p className={styles.closed}>La junta fue cancelada: ya no se puede confirmar asistencia.</p>
            ) : event.can_join || !event.group ? (
              <RsvpButtons status={event.my_status} onRespond={respond} disabled={isSaving} />
            ) : (
              <MembersOnlyNotice groupName={event.group.name} />
            )}
            {actionError && <p className={styles.error}>{actionError}</p>}
          </Card>
          <Card className={styles.orderPeople}>
            <AttendeeList
              participants={event.participants}
              creatorId={event.creator.id}
              // La llegada la marca el organizador, una vez empezada la junta.
              onMarkArrival={
                event.is_creator && event.has_started
                  ? (userId, arrival) => markParticipant(userId, { arrival })
                  : undefined
              }
              disabled={isSaving}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
