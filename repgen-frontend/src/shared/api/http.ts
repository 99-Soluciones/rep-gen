import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

/** Error HTTP de la API, con el `message` que devuelve el backend. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface OpcionesApiFetch {
  /**
   * Un 401 significa que la cookie de sesión expiró: se avisa y se recarga
   * para volver a la pantalla de acceso. Las llamadas de autenticación lo
   * desactivan porque para ellas un 401 es una respuesta esperada.
   */
  manejarSesionExpirada?: boolean;
}

/**
 * fetch contra la API: URL base, cookie de sesión (httpOnly), cuerpo JSON y
 * errores como `ApiError`. Devuelve el JSON de la respuesta (o undefined en 204).
 */
export const apiFetch = async <T>(
  ruta: string,
  { body, headers, ...init }: Omit<RequestInit, "body"> & { body?: unknown } = {},
  { manejarSesionExpirada = true }: OpcionesApiFetch = {},
): Promise<T> => {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...init,
    credentials: "include",
    headers:
      body === undefined ? headers : { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (respuesta.status === 401 && manejarSesionExpirada) {
    toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
    window.location.reload();
  }

  if (!respuesta.ok) {
    const error = (await respuesta.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(respuesta.status, error?.message ?? respuesta.statusText);
  }

  return (respuesta.status === 204 ? undefined : await respuesta.json()) as T;
};
