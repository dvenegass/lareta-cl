import styles from "./Toggle.module.css";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string; // para lectores de pantalla
  disabled?: boolean;
};

/** Interruptor encendido/apagado. */
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.toggle}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className={styles.knob} />
    </button>
  );
}
