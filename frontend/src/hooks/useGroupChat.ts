import { useCallback, useEffect, useRef, useState } from "react";

import * as chatApi from "../api/chat";
import { ApiError } from "../api/client";
import type { ChatDraft, ChatMessage, ChatSocketEvent } from "../types";

/** Debe coincidir con PAGE_SIZE en backend/apps/chat/selectors.py. */
const PAGE_SIZE = 50;
/** Cada cuánto, como máximo, se avisa "estoy escribiendo". */
const TYPING_THROTTLE_MS = 2500;
/** Cuánto dura el aviso "fulano está escribiendo…" si no llega otro. */
const TYPING_VISIBLE_MS = 4000;
/** Espera máxima entre reintentos de conexión. */
const MAX_RETRY_MS = 15000;

export type ConnectionStatus = "connecting" | "online" | "offline";

type Typist = { id: number; username: string; until: number };

/** Agrega mensajes sin duplicar (pueden llegar por la API y por el WebSocket) y ordena por id. */
function merge(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

/**
 * Chat en tiempo real de un grupo.
 *
 * 1. Carga los últimos mensajes por la API.
 * 2. Abre un WebSocket por donde llegan los mensajes nuevos, los borrados
 *    y los avisos de "está escribiendo".
 * 3. Si la conexión se corta, reintenta (cada vez esperando un poco más) y,
 *    al volver, pide por la API lo que se perdió mientras tanto.
 *
 * Enviar y borrar se hace por la API (valida y guarda); el WebSocket solo avisa.
 */
export function useGroupChat(groupId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [typists, setTypists] = useState<Typist[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const lastIdRef = useRef(0); // id del último mensaje conocido, para recuperar lo perdido
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    lastIdRef.current = messages.length ? messages[messages.length - 1].id : 0;
  }, [messages]);

  // 1. Carga inicial
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(false);
    chatApi
      .listMessages(groupId)
      .then((initial) => {
        if (cancelled) return;
        setMessages(initial);
        setHasOlder(initial.length === PAGE_SIZE);
      })
      .catch(() => !cancelled && setLoadError(true))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  // 2 y 3. WebSocket con reconexión
  useEffect(() => {
    let disposed = false;
    let retries = 0;
    let retryTimer: number | undefined;

    function handleEvent(event: ChatSocketEvent) {
      switch (event.type) {
        case "message.created":
          setMessages((current) => merge(current, [event.message]));
          // Si mandó un mensaje, ya terminó de escribir.
          setTypists((current) => current.filter((t) => t.id !== event.message.author.id));
          break;
        case "message.deleted":
          setMessages((current) => current.filter((m) => m.id !== event.id));
          break;
        case "typing":
          setTypists((current) => [
            ...current.filter((t) => t.id !== event.user.id),
            { ...event.user, until: Date.now() + TYPING_VISIBLE_MS },
          ]);
          break;
      }
    }

    function connect() {
      setStatus("connecting");
      const socket = new WebSocket(chatApi.chatSocketUrl(groupId));
      socketRef.current = socket;

      socket.onopen = () => {
        retries = 0;
        setStatus("online");
        // Recupera lo que llegó mientras no estábamos conectados.
        if (lastIdRef.current) {
          chatApi
            .listMessages(groupId, { after: lastIdRef.current })
            .then((missed) => missed.length && setMessages((current) => merge(current, missed)))
            .catch(() => {});
        }
      };

      socket.onmessage = (e) => handleEvent(JSON.parse(e.data) as ChatSocketEvent);

      socket.onclose = () => {
        if (disposed) return;
        setStatus("offline");
        // Reintenta: 1 s, 2 s, 4 s, 8 s… hasta 15 s entre intentos.
        const delay = Math.min(1000 * 2 ** retries, MAX_RETRY_MS);
        retries += 1;
        retryTimer = window.setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [groupId]);

  // Quita los avisos de "está escribiendo" que ya vencieron.
  useEffect(() => {
    if (typists.length === 0) return;
    const nextExpiry = Math.min(...typists.map((t) => t.until));
    const timer = window.setTimeout(
      () => setTypists((current) => current.filter((t) => t.until > Date.now())),
      Math.max(nextExpiry - Date.now(), 0) + 50,
    );
    return () => window.clearTimeout(timer);
  }, [typists]);

  async function send(draft: ChatDraft) {
    setActionError(null);
    try {
      const message = await chatApi.sendMessage(groupId, draft);
      setMessages((current) => merge(current, [message]));
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo enviar.");
      return false;
    }
  }

  async function remove(messageId: number) {
    setActionError(null);
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((current) => current.filter((m) => m.id !== messageId));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo borrar.");
    }
  }

  async function loadOlder() {
    if (!messages.length || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const older = await chatApi.listMessages(groupId, { before: messages[0].id });
      setMessages((current) => merge(current, older));
      setHasOlder(older.length === PAGE_SIZE);
    } catch {
      setActionError("No se pudieron cargar los mensajes anteriores.");
    } finally {
      setIsLoadingOlder(false);
    }
  }

  /** Llamar mientras se escribe: avisa a los demás (como mucho cada 2,5 s). */
  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    const now = Date.now();
    if (socket?.readyState !== WebSocket.OPEN || now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;
    socket.send(JSON.stringify({ type: "typing" }));
  }, []);

  return {
    messages,
    isLoading,
    loadError,
    hasOlder,
    isLoadingOlder,
    status,
    typists: typists.map((t) => t.username),
    actionError,
    /** Para errores detectados antes de enviar (p. ej. una imagen muy pesada); null lo borra. */
    setActionError,
    send,
    remove,
    loadOlder,
    notifyTyping,
  };
}
