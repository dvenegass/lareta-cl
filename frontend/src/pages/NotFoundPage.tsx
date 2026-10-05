import { Compass } from "lucide-react";

import { ButtonLink } from "../components/ui/Button";
import { StatusMessage } from "../components/ui/StatusMessage";

export function NotFoundPage() {
  return (
    <StatusMessage icon={<Compass />} title="Esta página no existe.">
      <ButtonLink to="/" variant="secondary">
        Ir al inicio
      </ButtonLink>
    </StatusMessage>
  );
}
