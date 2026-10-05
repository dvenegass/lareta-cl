import { Check, Clock, Pencil, UserMinus, UserPlus, X } from "lucide-react";

import type { ProfileRelationship } from "../../types";
import { Button, ButtonLink } from "../ui/Button";
import styles from "./FriendshipAction.module.css";

type FriendshipActionProps = {
  relationship: ProfileRelationship;
  username: string;
  disabled: boolean;
  onAdd: () => void;
  onAccept: () => void;
  onCancelOrDecline: () => void;
  onRemove: () => void;
};

/** El botón correcto según la relación con esa persona. */
export function FriendshipAction({
  relationship,
  username,
  disabled,
  onAdd,
  onAccept,
  onCancelOrDecline,
  onRemove,
}: FriendshipActionProps) {
  switch (relationship) {
    case "self":
      return (
        <ButtonLink to="/profile" variant="secondary" icon={<Pencil />}>
          Editar perfil
        </ButtonLink>
      );
    case "friends":
      return (
        <div className={styles.row}>
          <span className={styles.status}>
            <Check aria-hidden /> Son amigos
          </span>
          <Button
            variant="ghost"
            icon={<UserMinus />}
            disabled={disabled}
            onClick={() => window.confirm(`¿Eliminar a ${username} de tus amigos?`) && onRemove()}
          >
            Eliminar
          </Button>
        </div>
      );
    case "request_sent":
      return (
        <div className={styles.row}>
          <span className={styles.status}>
            <Clock aria-hidden /> Solicitud enviada
          </span>
          <Button variant="ghost" icon={<X />} disabled={disabled} onClick={onCancelOrDecline}>
            Cancelar
          </Button>
        </div>
      );
    case "request_received":
      return (
        <div className={styles.row}>
          <Button icon={<Check />} disabled={disabled} onClick={onAccept}>
            Aceptar solicitud
          </Button>
          <Button variant="ghost" disabled={disabled} onClick={onCancelOrDecline}>
            Rechazar
          </Button>
        </div>
      );
    default:
      return (
        <Button icon={<UserPlus />} disabled={disabled} onClick={onAdd}>
          Agregar amigo
        </Button>
      );
  }
}
