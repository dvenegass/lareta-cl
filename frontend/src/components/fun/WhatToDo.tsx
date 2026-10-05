import {
  Beer,
  CalendarPlus,
  Clapperboard,
  Dices,
  Footprints,
  Gamepad2,
  House,
  MicVocal,
  Pizza,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, ButtonLink } from "../ui/Button";
import { Card } from "../ui/Card";
import styles from "./WhatToDo.module.css";

const IDEAS: { icon: LucideIcon; label: string }[] = [
  { icon: Gamepad2, label: "Jugar algo" },
  { icon: Pizza, label: "Ir a comer" },
  { icon: Clapperboard, label: "Ir al cine" },
  { icon: House, label: "Junta en casa" },
  { icon: Target, label: "Bowling" },
  { icon: Footprints, label: "Salir a caminar" },
  { icon: Beer, label: "Ir por algo" },
  { icon: MicVocal, label: "Karaoke" },
];

const SPIN_MS = 900;
const TICK_MS = 80;

function randomIdea(exclude?: number) {
  let index = Math.floor(Math.random() * IDEAS.length);
  if (index === exclude) index = (index + 1) % IDEAS.length; // que no repita la anterior
  return index;
}

/** Para cuando nadie sabe qué hacer: elige un plan al azar. */
export function WhatToDo() {
  const [current, setCurrent] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function roll() {
    const final = randomIdea(current ?? undefined);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setCurrent(final);
      return;
    }

    // "Ruleta": va mostrando ideas al azar y se detiene en la elegida.
    setIsSpinning(true);
    for (let elapsed = 0; elapsed < SPIN_MS; elapsed += TICK_MS) {
      timers.current.push(window.setTimeout(() => setCurrent(randomIdea()), elapsed));
    }
    timers.current.push(
      window.setTimeout(() => {
        setCurrent(final);
        setIsSpinning(false);
      }, SPIN_MS),
    );
  }

  const idea = current === null ? null : IDEAS[current];
  const Icon = idea ? idea.icon : Dices;

  return (
    <Card className={styles.card}>
      <div className={styles.result} aria-live="polite">
        <span className={[styles.icon, isSpinning && styles.spinning].filter(Boolean).join(" ")} aria-hidden>
          <Icon />
        </span>
        <span className={styles.label}>{idea ? idea.label : "¿Nadie sabe qué hacer?"}</span>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" icon={<Dices />} onClick={roll} disabled={isSpinning}>
          {idea ? "Otra vez" : "¿Qué hacemos?"}
        </Button>
        {idea && !isSpinning && (
          <ButtonLink to={`/events/new?title=${encodeURIComponent(idea.label)}`} icon={<CalendarPlus />}>
            Crear junta con esto
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
