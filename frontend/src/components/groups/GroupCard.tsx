import { Link } from "react-router";

import type { GroupSummary } from "../../types";
import { AvatarStack } from "../ui/AvatarStack";
import { GroupAvatar } from "./GroupAvatar";
import styles from "./GroupCard.module.css";

export function GroupCard({ group }: { group: GroupSummary }) {
  return (
    <Link to={`/groups/${group.id}`} className={styles.card}>
      <GroupAvatar group={group} size={52} />
      <div className={styles.text}>
        <h3 className={styles.name}>{group.name}</h3>
        {group.description && <p className={styles.description}>{group.description}</p>}
      </div>
      <div className={styles.footer}>
        <AvatarStack users={group.members_preview} total={group.member_count} size={28} />
        <span className={styles.count}>
          {group.member_count} {group.member_count === 1 ? "miembro" : "miembros"}
        </span>
      </div>
    </Link>
  );
}
