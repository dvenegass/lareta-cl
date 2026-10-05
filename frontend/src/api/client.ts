// Única puerta de salida hacia el backend. Se encarga de JSON, cookies y CSRF.

type ErrorBody = Record<string, unknown> | null;

export class ApiError extends Error {
  status: number;
  body: ErrorBody;

  constructor(status: number, body: ErrorBody) {
    super(firstMessage(body) ?? "Algo salió mal. Inténtalo de nuevo.");
    this.status = status;
    this.body = body;
  }

  /** Errores por campo, p. ej. { username: "Ya existe un usuario..." }. */
  get fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const [field, value] of Object.entries(this.body ?? {})) {
      const message = toMessage(value);
      if (message) errors[field] = message;
    }
    return errors;
  }
}

function toMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function firstMessage(body: ErrorBody): string | null {
  if (!body) return null;
  const preferred = body.detail ?? body.non_field_errors;
  return toMessage(preferred) ?? toMessage(Object.values(body)[0]);
}

function getCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function request<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body; // el navegador pone el Content-Type multipart
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  if (method !== "GET") {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: payload,
    credentials: "same-origin",
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data);
  return data as T;
}
