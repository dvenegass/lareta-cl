import { Check } from "lucide-react";

import type { User } from "../../types";
import { Avatar } from "../ui/Avatar";
import styles from "./FriendPicker.module.css";

type FriendPickerProps = {
  friends: User[];
  selected: number[];
  onChange: (selected: number[]) => void;
};

/** Elegir varios amigos (para crear un grupo o agregarlos a uno). */
export function FriendPicker({ friends, selected, onChange }: FriendPickerProps) {
  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <ul className={styles.list}>
      {friends.map((friend) => {
        const isSelected = selected.includes(friend.id);
        return (
          <li key={friend.id}>
            <button
              type="button"
              className={[styles.option, isSelected && styles.selected].filter(Boolean).join(" ")}
              onClick={() => toggle(friend.id)}
              aria-pressed={isSelected}
              aria-label={friend.username}
            >
              <Avatar user={friend} size={32} />
              <span className={styles.name}>{friend.username}</span>
              <span className={styles.check} aria-hidden>
                {isSelected && <Check />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
