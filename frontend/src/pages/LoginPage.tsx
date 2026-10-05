import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";

import { ApiError } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import formStyles from "../components/auth/AuthForm.module.css";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Al iniciar sesión, <RequireGuest> redirige solo (a `next` o al dashboard).
      await login({ username: username.trim(), password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
      setIsSubmitting(false);
    }
  }

  const registerLink = `/register${searchParams.size ? `?${searchParams}` : ""}`;

  return (
    <AuthCard
      title="¡Hola de nuevo!"
      subtitle="Entra para ver tus juntas."
      footer={
        <>
          ¿No tienes cuenta? <Link to={registerLink}>Crea una</Link>
        </>
      }
    >
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <TextField
          label="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          required
        />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Link to="/forgot-password" className={formStyles.forgot}>
          ¿Olvidaste tu contraseña?
        </Link>
        {error && <p className={formStyles.error}>{error}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Entrando…" : "Iniciar sesión"}
        </Button>
      </form>
    </AuthCard>
  );
}
