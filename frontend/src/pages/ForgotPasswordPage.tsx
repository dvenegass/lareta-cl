import { MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";

import { requestPasswordReset } from "../api/auth";
import { ApiError } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import formStyles from "../components/auth/AuthForm.module.css";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import styles from "./ForgotPasswordPage.module.css";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Pediste demasiados enlaces. Espera un rato e inténtalo de nuevo.");
      } else {
        setError(err instanceof ApiError ? err.message : "No se pudo enviar. Inténtalo de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const backToLogin = (
    <>
      ¿La recordaste? <Link to="/login">Inicia sesión</Link>
    </>
  );

  if (sentTo) {
    return (
      <AuthCard title="Revisa tu email" subtitle="Te mandamos las instrucciones." footer={backToLogin}>
        <div className={styles.sent}>
          <span className={styles.sentIcon} aria-hidden>
            <MailCheck />
          </span>
          <p>
            Si hay una cuenta con <strong>{sentTo}</strong>, te llegará un enlace para elegir una nueva
            contraseña. Caduca en 1 hora.
          </p>
          <p className={styles.small}>¿No llega? Revisa la carpeta de spam.</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="¿Olvidaste tu contraseña?"
      subtitle="Escribe el email de tu cuenta y te mandamos un enlace."
      footer={backToLogin}
    >
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
        />
        {error && <p className={formStyles.error}>{error}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Enviando…" : "Enviar enlace"}
        </Button>
      </form>
    </AuthCard>
  );
}
