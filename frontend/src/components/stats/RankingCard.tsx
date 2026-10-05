import { Crown } from "lucide-react";

import type { Ranking } from "../../types";
import { formatMoney } from "../../utils/money";
import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";
import { UserLink } from "../ui/UserLink";
import styles from "./RankingCard.module.css";
import { rankingIcon } from "./statIcons";

const POSITION_CLASSES = [styles.gold, styles.silver, styles.bronze];

function formatValue(ranking: Ranking, value: number) {
  return ranking.key === "spender" ? formatMoney(value) : String(value);
}

export function RankingCard({ ranking, currentUserId }: { ranking: Ranking; currentUserId: number }) {
  const Icon = rankingIcon(ranking.key);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden>
          <Icon />
        </span>
        <div>
          <h3 className={styles.title}>{ranking.title}</h3>
          <p className={styles.unit}>Por {ranking.unit}</p>
        </div>
      </div>

      {ranking.entries.length === 0 ? (
        <p className={styles.empty}>Nadie todavía.</p>
      ) : (
        <ol className={styles.list}>
          {ranking.entries.map(({ user, value }, index) => (
            <li
              key={user.id}
              className={[styles.entry, user.id === currentUserId && styles.me].filter(Boolean).join(" ")}
            >
              <span className={[styles.position, POSITION_CLASSES[index]].join(" ")} aria-label={`Puesto ${index + 1}`}>
                {index === 0 ? <Crown aria-hidden /> : index + 1}
              </span>
              <UserLink username={user.username} className={styles.userLink}>
                <Avatar user={user} size={28} />
                <span className={styles.name}>{user.username}</span>
              </UserLink>
              <span className={styles.value}>{formatValue(ranking, value)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
