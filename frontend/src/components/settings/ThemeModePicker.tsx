import { Monitor, Moon, Sun } from "lucide-react";

import type { ThemeMode } from "../../theme/theme";
import { SegmentedControl, type SegmentedOption } from "../ui/SegmentedControl";

const MODES: SegmentedOption<ThemeMode>[] = [
  { value: "light", label: "Día", icon: Sun },
  { value: "dark", label: "Noche", icon: Moon },
  { value: "system", label: "Automático", icon: Monitor },
];

type ThemeModePickerProps = {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
};

export function ThemeModePicker({ value, onChange }: ThemeModePickerProps) {
  return <SegmentedControl options={MODES} value={value} onChange={onChange} label="Modo" />;
}
