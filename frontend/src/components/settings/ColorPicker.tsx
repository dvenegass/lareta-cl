import { Check, Pipette } from "lucide-react";

import { THEME_PRESETS } from "../../theme/theme";
import styles from "./ColorPicker.module.css";

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

/** Colores sugeridos + selector libre. */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const isCustom = !THEME_PRESETS.some((preset) => preset.color === value);

  return (
    <div className={styles.grid} role="radiogroup" aria-label="Color principal">
      {THEME_PRESETS.map((preset) => {
        const isSelected = preset.color === value;
        return (
          <button
            key={preset.color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={styles.option}
            onClick={() => onChange(preset.color)}
          >
            <span className={styles.swatch} style={{ background: preset.color }}>
              {isSelected && <Check aria-hidden />}
            </span>
            <span className={styles.name}>{preset.name}</span>
          </button>
        );
      })}

      <label className={styles.option}>
        <span
          className={[styles.swatch, styles.customSwatch].join(" ")}
          style={isCustom ? { background: value } : undefined}
        >
          {isCustom ? <Check aria-hidden /> : <Pipette aria-hidden />}
        </span>
        <span className={styles.name}>Otro</span>
        <input
          type="color"
          className={styles.colorInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Elegir otro color"
        />
      </label>
    </div>
  );
}
