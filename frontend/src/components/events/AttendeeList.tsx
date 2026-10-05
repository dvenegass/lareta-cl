import type { Arrival, Participant } from "../../types";
import { Avatar } from "../ui/Avatar";
import { UserLink } from "../ui/UserLink";
import { ArrivalBadge, ArrivalPicker } from "./ArrivalPicker";
import styles from "./AttendeeList.module.css";

type AttendeeListProps = {
  participants: Participant[];
  creatorId: number;
  /** Si se pasa, el organizador puede marcar la llegada de cada uno. */
  onMarkArrival?: (userId: number, arrival: Arrival | null) => void;
  disabled?: boolean;
};

export function AttendeeList({ participants, creatorId, onMarkArrival, disabled }: AttendeeListProps) {
  const going = participants.filter((p) => p.status === "going");
  const notGoing = participants.filter((p) => p.status === "not_going");

  return (
    <div className={styles.wrapper}>
      <section>
        <h3 className={styles.heading}>
          Van <span className={styles.count}>{going.length}</span>
        </h3>
        {onMarkArrival && going.length > 0 && <p className={styles.hint}>Marca quién llegó y cómo.</p>}
        {going.length === 0 ? (
          <p className={styles.empty}>Todavía nadie ha confirmado.</p>
        ) : (
          <ul className={styles.list}>
            {going.map(({ user, arrival }) => (
              <li key={user.id} className={styles.person}>
                <UserLink username={user.username} className={styles.userLink}>
                  <Avatar user={user} size={34} />
                  <span className={styles.name}>{user.username}</span>
                </UserLink>
                {user.id === creatorId && <span className={styles.tag}>Organiza</span>}
                <span className={styles.arrival}>
                  {onMarkArrival ? (
                    <ArrivalPicker
                      value={arrival}
                      onChange={(value) => onMarkArrival(user.id, value)}
                      disabled={disabled}
                    />
                  ) : (
                    arrival && <ArrivalBadge arrival={arrival} />
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {notGoing.length > 0 && (
        <section>
          <h3 className={styles.heading}>
            No van <span className={styles.count}>{notGoing.length}</span>
          </h3>
          <ul className={[styles.list, styles.muted].join(" ")}>
            {notGoing.map(({ user }) => (
              <li key={user.id} className={styles.person}>
                <UserLink username={user.username} className={styles.userLink}>
                  <Avatar user={user} size={28} />
                  <span className={styles.name}>{user.username}</span>
                </UserLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
