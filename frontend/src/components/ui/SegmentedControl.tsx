import type { LucideIcon } from "lucide-react";

import styles from "./SegmentedControl.module.css";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string; // para lectores de pantalla
};

/** Grupo de botones donde solo uno está activo (como un selector de pestañas). */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div
      className={styles.group}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      role="radiogroup"
      aria-label={label}
    >
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
        <button
          key={optionValue}
          type="button"
          role="radio"
          aria-checked={value === optionValue}
          className={styles.option}
          onClick={() => onChange(optionValue)}
        >
          {Icon && <Icon aria-hidden />}
          {optionLabel}
        </button>
      ))}
    </div>
  );
}
