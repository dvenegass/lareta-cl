import { CalendarHeart, Users } from "lucide-react";
import { Link, useParams } from "react-router";

import { EventRow } from "../components/dashboard/EventRow";
import { GroupAvatar } from "../components/groups/GroupAvatar";
import { FriendshipAction } from "../components/profile/FriendshipAction";
import { ProfileStats } from "../components/profile/ProfileStats";
import { levelIcon } from "../components/stats/statIcons";
import { Avatar } from "../components/ui/Avatar";
import { Card } from "../components/ui/Card";
import { SkeletonPage } from "../components/ui/Skeleton";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useUserProfile } from "../hooks/useUserProfile";
import { formatMonthYear } from "../utils/dates";
import styles from "./UserProfilePage.module.css";

export function UserProfilePage() {
  const { username = "" } = useParams();
  const { profile, isLoading, error, isSaving, actionError, addFriend, accept, cancelOrDecline, removeFriend } =
    useUserProfile(username);

  if (isLoading) return <SkeletonPage />;
  if (error || !profile) return <StatusMessage tone="error" title="No encontramos a esta persona." />;

  const LevelIcon = levelIcon(profile.level.number);
  const isMe = profile.relationship === "self";

  return (
    <div className={styles.page}>
      <Card className={styles.header}>
        <Avatar user={profile.user} size={96} />
        <div className={styles.identity}>
          <h1 className={styles.name}>{profile.user.username}</h1>
          <p className={styles.since}>Miembro desde {formatMonthYear(new Date(profile.date_joined))}</p>
          <div className={styles.chips}>
            <span className={styles.chip}>
              <LevelIcon aria-hidden />
              Nivel {profile.level.number} · {profile.level.name}
            </span>
            <span className={styles.chip}>
              <Users aria-hidden />
              {profile.friends_count} {profile.friends_count === 1 ? "amigo" : "amigos"}
            </span>
          </div>
        </div>
        <div className={styles.action}>
          <FriendshipAction
            relationship={profile.relationship}
            username={profile.user.username}
            disabled={isSaving}
            onAdd={addFriend}
            onAccept={accept}
            onCancelOrDecline={cancelOrDecline}
            onRemove={removeFriend}
          />
          {actionError && <p className={styles.error}>{actionError}</p>}
        </div>
      </Card>

      <ProfileStats profile={profile} />

      {!isMe && (
        <div className={styles.columns}>
          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Próximas juntas en común</h2>
            {profile.shared_upcoming.length === 0 ? (
              <p className={styles.empty}>
                <CalendarHeart aria-hidden /> No tienen juntas próximas juntos.
              </p>
            ) : (
              <ul className={styles.list}>
                {profile.shared_upcoming.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </ul>
            )}
          </Card>

          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Grupos en común</h2>
            {profile.common_groups.length === 0 ? (
              <p className={styles.empty}>
                <Users aria-hidden /> No están en ningún grupo juntos.
              </p>
            ) : (
              <ul className={styles.groups}>
                {profile.common_groups.map((group) => (
                  <li key={group.id}>
                    <Link to={`/groups/${group.id}`} className={styles.group}>
                      <GroupAvatar group={group} size={36} />
                      <span>{group.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
