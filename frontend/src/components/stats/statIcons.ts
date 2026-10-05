import {
  AlarmClockCheck,
  Beer,
  CalendarCheck,
  Crown,
  Egg,
  Flame,
  Gem,
  Ghost,
  HandCoins,
  Handshake,
  MapPinned,
  PartyPopper,
  Snail,
  Trophy,
  type LucideIcon,
} from "lucide-react";

// El backend identifica cada ranking por `key` y cada nivel por `number`;
// qué icono se ve es decisión del frontend.

export const RANKING_ICONS: Record<string, LucideIcon> = {
  punctual: AlarmClockCheck,
  late: Snail,
  attended: Beer,
  cancelled: Ghost,
  soul: PartyPopper,
  places: MapPinned,
  organizer: CalendarCheck,
  spender: HandCoins,
};

const LEVEL_ICONS: LucideIcon[] = [Egg, Handshake, Flame, PartyPopper, Gem, Crown];

export const rankingIcon = (key: string) => RANKING_ICONS[key] ?? Trophy;

export const levelIcon = (number: number) => LEVEL_ICONS[number - 1] ?? Trophy;
