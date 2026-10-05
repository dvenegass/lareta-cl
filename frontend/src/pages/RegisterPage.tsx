import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";

import { ApiError } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import formStyles from "../components/auth/AuthForm.module.css";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      await register({ ...values, username: values.username.trim(), email: values.email.trim() });
    } catch (err) {
      setErrors(err instanceof ApiError ? err.fieldErrors : { detail: "No se pudo crear la cuenta." });
      setIsSubmitting(false);
    }
  }

  const loginLink = `/login${searchParams.size ? `?${searchParams}` : ""}`;

  return (
    <AuthCard
      title="Crea tu cuenta"
      subtitle="Y empieza a organizar juntas en segundos."
      footer={
        <>
          ¿Ya tienes cuenta? <Link to={loginLink}>Inicia sesión</Link>
        </>
      }
    >
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <TextField
          label="Nombre de usuario"
          value={values.username}
          onChange={update("username")}
          error={errors.username}
          autoComplete="username"
          autoFocus
          required
        />
        <TextField
          label="Email"
          type="email"
          hint="Opcional, pero sin él no podrás recuperar tu contraseña."
          value={values.email}
          onChange={update("email")}
          error={errors.email}
          autoComplete="email"
        />
        <TextField
          label="Contraseña"
          type="password"
          hint="Mínimo 8 caracteres."
          value={values.password}
          onChange={update("password")}
          error={errors.password}
          autoComplete="new-password"
          required
        />
        {errors.detail && <p className={formStyles.error}>{errors.detail}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>
    </AuthCard>
  );
}
