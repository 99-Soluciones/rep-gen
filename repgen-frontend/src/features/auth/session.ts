const USUARIO_STORAGE_KEY = "usuario:v1";
// Clave sin versión: respaldo mientras sigan vivas sesiones anteriores a "usuario:v1".
const USUARIO_STORAGE_KEY_LEGACY = "usuario";

/** Datos no sensibles del usuario. El JWT vive en una cookie httpOnly. */
export interface UsuarioSesion {
  name?: string;
  tenant?: string;
}

/** Usuario guardado, o null si no hay o el valor está corrupto. */
export const leerUsuario = (): UsuarioSesion | null => {
  try {
    const guardado =
      localStorage.getItem(USUARIO_STORAGE_KEY) ??
      localStorage.getItem(USUARIO_STORAGE_KEY_LEGACY);
    return guardado ? (JSON.parse(guardado) as UsuarioSesion) : null;
  } catch {
    return null;
  }
};

export const guardarUsuario = (usuario: UsuarioSesion): void => {
  localStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(usuario));
};

export const borrarUsuario = (): void => {
  localStorage.removeItem(USUARIO_STORAGE_KEY);
  localStorage.removeItem(USUARIO_STORAGE_KEY_LEGACY);
  localStorage.removeItem("jwt_reportes"); // token de antes de la cookie httpOnly
};
