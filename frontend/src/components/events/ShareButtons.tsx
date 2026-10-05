import { Check, Link2, MessageCircle } from "lucide-react";
import { useState } from "react";

import type { EventSummary } from "../../types";
import { eventShareMessage, eventShareUrl, whatsappShareUrl } from "../../utils/share";
import { Button } from "../ui/Button";
import styles from "./ShareButtons.module.css";

type ShareButtonsProps = {
  event: Pick<EventSummary, "id" | "title" | "starts_at" | "location">;
};

/** Compartir la junta: por WhatsApp (mensaje listo) o copiando el enlace con vista previa. */
export function ShareButtons({ event }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(eventShareUrl(event.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <a
        href={whatsappShareUrl(eventShareMessage(event))}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsapp}
      >
        <MessageCircle aria-hidden />
        Compartir por WhatsApp
      </a>
      <Button variant="secondary" icon={copied ? <Check /> : <Link2 />} onClick={copyLink}>
        {copied ? "¡Enlace copiado!" : "Copiar enlace"}
      </Button>
    </>
  );
}
