import { Plus, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import styles from "./BringItemsInput.module.css";

const SUGGESTIONS = ["Carbón", "Hielo", "Bebidas", "Pan", "Carne", "Vasos", "Parlante", "Snacks"];
const MAX_ITEMS = 30;

type BringItemsInputProps = {
  items: string[];
  onChange: (items: string[]) => void;
};

/** Armar la lista de "qué llevar" al crear la junta: escribir o tocar una sugerencia. */
export function BringItemsInput({ items, onChange }: BringItemsInputProps) {
  const [text, setText] = useState("");
  const has = (name: string) => items.some((item) => item.toLowerCase() === name.toLowerCase());

  function add(name: string) {
    const clean = name.trim();
    if (!clean || has(clean) || items.length >= MAX_ITEMS) return;
    onChange([...items, clean]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Enter agrega el ítem (sin enviar el formulario de la junta).
    if (e.key === "Enter") {
      e.preventDefault();
      add(text);
      setText("");
    }
  }

  const suggestions = SUGGESTIONS.filter((name) => !has(name));

  return (
    <div className={styles.wrapper}>
      {items.length > 0 && (
        <ul className={styles.chips}>
          {items.map((item) => (
            <li key={item} className={styles.chip}>
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i !== item))}
                aria-label={`Quitar ${item}`}
              >
                <X aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="Escribe algo y presiona Enter"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={80}
          aria-label="Agregar a la lista de qué llevar"
        />
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            add(text);
            setText("");
          }}
          disabled={!text.trim()}
          aria-label="Agregar"
        >
          <Plus aria-hidden />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <span>Sugerencias:</span>
          {suggestions.map((name) => (
            <button key={name} type="button" className={styles.suggestion} onClick={() => add(name)}>
              <Plus aria-hidden /> {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
