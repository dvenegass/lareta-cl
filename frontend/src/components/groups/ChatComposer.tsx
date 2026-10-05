import { ImagePlus, Send, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import type { ChatDraft, Gif } from "../../types";
import { IMAGE_TYPES, validateImageFile } from "../../utils/images";
import { Button } from "../ui/Button";
import styles from "./ChatComposer.module.css";
import { GifPicker } from "./GifPicker";

type ChatComposerProps = {
  /** Imagen elegida (vive en el chat, para poder soltarla en cualquier parte). */
  image: File | null;
  onImageChange: (file: File | null) => void;
  onSend: (draft: ChatDraft) => Promise<boolean>;
  onTyping: () => void;
  onError: (message: string | null) => void;
};

/** Caja para escribir: texto, adjuntar imagen (botón, pegar o soltar) y GIFs. */
export function ChatComposer({ image, onImageChange, onSend, onTyping, onError }: ChatComposerProps) {
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPickingGif, setIsPickingGif] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Vista previa local de la imagen elegida (se libera al cambiarla).
  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function pickImage(file: File | undefined) {
    if (!file) return;
    const error = validateImageFile(file);
    onError(error);
    if (!error) {
      onImageChange(file);
      textareaRef.current?.focus();
    }
  }

  async function send(draft: ChatDraft) {
    if (isSending) return;
    setIsSending(true);
    if (await onSend(draft)) {
      setBody("");
      onImageChange(null);
    }
    setIsSending(false);
  }

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!body.trim() && !image) return;
    send({ body: body.trim(), image });
  }

  // Como en Discord: elegir un GIF lo envía de inmediato (con el texto escrito, si hay).
  function handleGif(gif: Gif) {
    setIsPickingGif(false);
    send({ body: body.trim(), gif });
  }

  // Enter envía; Shift+Enter hace un salto de línea.
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Pegar una imagen (Ctrl+V) la adjunta.
  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      pickImage(file);
    }
  }

  return (
    <div className={styles.composer}>
      {image && previewUrl && (
        <div className={styles.attachment}>
          <img src={previewUrl} alt="" className={styles.thumb} />
          <span className={styles.fileName}>{image.name}</span>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => onImageChange(null)}
            aria-label="Quitar imagen"
          >
            <X aria-hidden />
          </button>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Adjuntar imagen"
          title="Adjuntar imagen"
        >
          <ImagePlus aria-hidden />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          hidden
          onChange={(e) => {
            pickImage(e.target.files?.[0]);
            e.target.value = ""; // permite volver a elegir el mismo archivo
          }}
        />

        <textarea
          ref={textareaRef}
          className={styles.input}
          placeholder={image ? "Agrega un comentario (opcional)…" : "Escribe un mensaje…"}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (e.target.value.trim()) onTyping();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          maxLength={1000}
          aria-label="Mensaje"
        />

        <div className={styles.gifSlot}>
          <button
            type="button"
            className={[styles.gifButton, isPickingGif && styles.active].filter(Boolean).join(" ")}
            onClick={() => setIsPickingGif((open) => !open)}
            aria-label="Elegir un GIF"
            aria-expanded={isPickingGif}
            title="GIFs"
            data-gif-toggle
          >
            GIF
          </button>
          {isPickingGif && <GifPicker onPick={handleGif} onClose={() => setIsPickingGif(false)} />}
        </div>

        <Button
          type="submit"
          icon={<Send />}
          disabled={(!body.trim() && !image) || isSending}
          aria-label="Enviar"
        >
          {isSending ? "Enviando…" : "Enviar"}
        </Button>
      </form>
    </div>
  );
}
