import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";

import { ApiError } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import formStyles from "../components/auth/AuthForm.module.css";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { useAuth } from "../hooks/useAuth";

export function ResetPasswordPage() {
  const { uid = "", token = "" } = useParams();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmation) {
      setErrors({ confirmation: "Las contraseñas no coinciden." });
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    try {
      // Si sale bien queda la sesión iniciada y <RequireGuest> lleva al dashboard.
      await resetPassword({ uid, token, new_password: password });
    } catch (err) {
      setErrors(err instanceof ApiError ? err.fieldErrors : { detail: "No se pudo cambiar la contraseña." });
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Nueva contraseña"
      subtitle="Elige una que no uses en otros sitios."
      footer={
        <>
          ¿El enlace caducó? <Link to="/forgot-password">Pide otro</Link>
        </>
      }
    >
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <TextField
          label="Nueva contraseña"
          type="password"
          hint="Mínimo 8 caracteres."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.new_password}
          autoComplete="new-password"
          autoFocus
          required
        />
        <TextField
          label="Repítela"
          type="password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={errors.confirmation}
          autoComplete="new-password"
          required
        />
        {errors.detail && <p className={formStyles.error}>{errors.detail}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Guardar y entrar"}
        </Button>
      </form>
    </AuthCard>
  );
}
