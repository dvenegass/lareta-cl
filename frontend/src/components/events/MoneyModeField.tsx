import { Ban, Receipt, Wallet } from "lucide-react";

import type { MoneyMode } from "../../types";
import { SegmentedControl, type SegmentedOption } from "../ui/SegmentedControl";
import { TextField } from "../ui/TextField";
import styles from "./MoneyModeField.module.css";

const OPTIONS: SegmentedOption<MoneyMode>[] = [
  { value: "none", label: "Sin dinero", icon: Ban },
  { value: "fixed", label: "Cuota fija", icon: Wallet },
  { value: "shared", label: "Gastos compartidos", icon: Receipt },
];

const HINTS: Record<MoneyMode, string> = {
  none: "No hay que juntar plata.",
  fixed: "Cada uno pone lo mismo y tú marcas quién ya pagó.",
  shared: "Cada uno anota lo que pagó y la app calcula quién le debe a quién.",
};

type MoneyModeFieldProps = {
  mode: MoneyMode;
  feeAmount: string;
  feeError?: string;
  onModeChange: (mode: MoneyMode) => void;
  onFeeChange: (value: string) => void;
};

export function MoneyModeField({ mode, feeAmount, feeError, onModeChange, onFeeChange }: MoneyModeFieldProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>¿Cómo manejan la plata?</legend>
      <SegmentedControl options={OPTIONS} value={mode} onChange={onModeChange} label="Tipo de gastos" />
      <p className={styles.hint}>{HINTS[mode]}</p>

      {mode === "fixed" && (
        <TextField
          label="Cuánto pone cada uno"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder="5000"
          value={feeAmount}
          onChange={(e) => onFeeChange(e.target.value)}
          error={feeError}
          required
        />
      )}
    </fieldset>
  );
}
