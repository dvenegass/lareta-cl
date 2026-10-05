import { ImagePlus, MessagesSquare, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState, type DragEvent } from "react";

import { useGroupChat } from "../../hooks/useGroupChat";
import type { ChatMessage } from "../../types";
import { formatChatDay, formatTime, isSameDay } from "../../utils/dates";
import { validateImageFile } from "../../utils/images";
import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";
import { SkeletonRows } from "../ui/Skeleton";
import { UserLink } from "../ui/UserLink";
import { ChatComposer } from "./ChatComposer";
import styles from "./GroupChat.module.css";

/** Mensajes seguidos del mismo autor con menos de esto entre sí van agrupados. */
const GROUP_GAP_MS = 5 * 60 * 1000;
/** Si estás a menos de esto del final, los mensajes nuevos te bajan solos. */
const STICK_THRESHOLD_PX = 80;

type GroupChatProps = {
  groupId: number;
  currentUserId: number;
};

/** Para cada mensaje: ¿empieza un día nuevo? ¿lleva nombre y foto, o sigue al anterior? */
function layout(messages: ChatMessage[]) {
  return messages.map((message, i) => {
    const previous = messages[i - 1];
    const date = new Date(message.created_at);
    const previousDate = previous && new Date(previous.created_at);
    const newDay = !previous || !isSameDay(date, previousDate);
    const startsGroup =
      newDay ||
      previous.author.id !== message.author.id ||
      date.getTime() - previousDate.getTime() > GROUP_GAP_MS;
    return { message, date, newDay, startsGroup };
  });
}

/** Tamaño máximo con que se muestra una imagen o GIF en el chat. */
const MEDIA_MAX_WIDTH = 260;
const MEDIA_MAX_HEIGHT = 300;

/**
 * Tamaño en pantalla, achicado para caber en el máximo sin deformarse.
 * Se calcula de antemano para que la burbuja tome justo ese ancho (si se dejara
 * al navegador, la burbuja se estiraría según el tamaño original de la imagen).
 */
function fitMedia(width: number | null, height: number | null) {
  if (!width || !height) return undefined; // sin dimensiones: lo limita el CSS
  const scale = Math.min(MEDIA_MAX_WIDTH / width, MEDIA_MAX_HEIGHT / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Imagen o GIF del mensaje, con su espacio reservado para que el chat no salte al cargar. */
function MessageMedia({ message, onLoad }: { message: ChatMessage; onLoad: () => void }) {
  if (message.image) {
    return (
      <a href={message.image} target="_blank" rel="noreferrer" className={styles.media}>
        <img
          src={message.image}
          alt={`Imagen de ${message.author.username}`}
          style={fitMedia(message.image_width, message.image_height)}
          onLoad={onLoad}
        />
      </a>
    );
  }
  if (message.gif_url) {
    return (
      <span className={styles.media}>
        <img
          src={message.gif_url}
          alt="GIF"
          style={fitMedia(message.gif_width, message.gif_height)}
          onLoad={onLoad}
        />
      </span>
    );
  }
  return null;
}

function typingText(names: string[]) {
  if (names.length === 1) return `${names[0]} está escribiendo…`;
  if (names.length === 2) return `${names[0]} y ${names[1]} están escribiendo…`;
  return "Varias personas están escribiendo…";
}

/** Chat del grupo en tiempo real. */
export function GroupChat({ groupId, currentUserId }: GroupChatProps) {
  const chat = useGroupChat(groupId);
  const [image, setImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const heightBeforeOlder = useRef<number | null>(null);
  const lastSeenId = useRef(0);

  // Mantiene el scroll donde corresponde cada vez que cambian los mensajes.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const last = chat.messages[chat.messages.length - 1];

    if (heightBeforeOlder.current !== null) {
      // Se agregaron mensajes antiguos arriba: que no salte lo que estás leyendo.
      list.scrollTop += list.scrollHeight - heightBeforeOlder.current;
      heightBeforeOlder.current = null;
    } else if (last && last.id !== lastSeenId.current) {
      // Mensaje nuevo: baja si ya estabas abajo o si lo escribiste tú.
      if (stickToBottom.current || last.author.id === currentUserId) {
        list.scrollTop = list.scrollHeight;
      }
    }
    lastSeenId.current = last?.id ?? 0;
  }, [chat.messages, currentUserId]);

  function handleScroll() {
    const list = listRef.current!;
    stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < STICK_THRESHOLD_PX;
  }

  function loadOlder() {
    heightBeforeOlder.current = listRef.current?.scrollHeight ?? null;
    chat.loadOlder();
  }

  // Si una imagen termina de cargar y estabas abajo, sigue abajo.
  function handleMediaLoad() {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }

  // Arrastrar y soltar una imagen en cualquier parte del chat la adjunta.
  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const error = validateImageFile(file);
    chat.setActionError(error);
    if (!error) setImage(file);
  }

  return (
    <Card
      className={[styles.chat, isDragging && styles.dragging].filter(Boolean).join(" ")}
      onDragOver={handleDragOver}
      onDragLeave={(e) => {
        // Solo al salir del chat (no al pasar entre sus elementos internos).
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className={styles.dropHint} aria-hidden>
          <ImagePlus />
          Suelta la imagen para adjuntarla
        </div>
      )}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <MessagesSquare aria-hidden /> Chat del grupo
        </h2>

      </div>

      <div className={styles.list} ref={listRef} onScroll={handleScroll} aria-live="polite">
        {chat.isLoading ? (
          <SkeletonRows count={3} label="Cargando mensajes…" />
        ) : chat.loadError ? (
          <p className={styles.empty}>No pudimos cargar el chat.</p>
        ) : chat.messages.length === 0 ? (
          <p className={styles.empty}>Todavía no hay mensajes. ¡Rompe el hielo!</p>
        ) : (
          <>
            {chat.hasOlder && (
              <button type="button" className={styles.older} onClick={loadOlder} disabled={chat.isLoadingOlder}>
                {chat.isLoadingOlder ? "Cargando…" : "Ver mensajes anteriores"}
              </button>
            )}
            {layout(chat.messages).map(({ message, date, newDay, startsGroup }) => {
              const mine = message.author.id === currentUserId;
              return (
                <div key={message.id}>
                  {newDay && <p className={styles.day}>{formatChatDay(date)}</p>}
                  <div
                    className={[styles.row, mine && styles.mine, startsGroup && styles.groupStart]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {!mine && (
                      <span className={styles.avatarSlot}>
                        {startsGroup && (
                          <UserLink username={message.author.username}>
                            <Avatar user={message.author} size={30} />
                          </UserLink>
                        )}
                      </span>
                    )}
                    <div
                      className={[styles.bubble, (message.image || message.gif_url) && styles.withMedia]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {!mine && startsGroup && (
                        <UserLink username={message.author.username} className={styles.author}>
                          {message.author.username}
                        </UserLink>
                      )}
                      <MessageMedia message={message} onLoad={handleMediaLoad} />
                      {message.body && <p className={styles.body}>{message.body}</p>}
                      <span className={styles.time}>{formatTime(message.created_at)}</span>
                    </div>
                    {message.can_delete && (
                      <button
                        type="button"
                        className={styles.delete}
                        onClick={() => window.confirm("¿Borrar este mensaje?") && chat.remove(message.id)}
                        aria-label="Borrar mensaje"
                      >
                        <Trash2 aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <p className={styles.typing} aria-live="polite">
        {chat.typists.length > 0 && typingText(chat.typists)}
      </p>

      <ChatComposer
        image={image}
        onImageChange={setImage}
        onSend={chat.send}
        onTyping={chat.notifyTyping}
        onError={chat.setActionError}
      />
      {chat.actionError && <p className={styles.error}>{chat.actionError}</p>}
    </Card>
  );
}
