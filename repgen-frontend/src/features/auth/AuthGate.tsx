import { useEffect, useRef, useState, type ReactNode } from "react";
import { KeyRound } from "lucide-react";
import { ApiError, apiFetch } from "../../shared/api/http";
import { guardarUsuario, leerUsuario, type UsuarioSesion } from "./session";
import AvisoSesionExpirada from "./AvisoSesionExpirada";

export interface Sesion {
  tenant: string | null;
  /** Reporte pedido en la URL al abrir desde FileMaker (?report=...). */
  reporteInicio: string | null;
}

const SIN_SESION =
  "No hay sesión activa. Por favor, abre el reporte desde FileMaker.";
// Para estas llamadas un 401 es una respuesta esperada, no una sesión expirada.
const SIN_MANEJO_401 = { manejarSesionExpirada: false };

/**
 * Valida la sesión al cargar: canjea el token de FileMaker (?token=&tenant=)
 * por la cookie de sesión, o confirma con /auth/me que la cookie sigue
 * vigente. Solo renderiza la app cuando hay sesión.
 */
const AuthGate = ({ children }: { children: (sesion: Sesion) => ReactNode }) => {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [errorAutenticacion, setErrorAutenticacion] = useState<string | null>(null);
  const peticionEnviada = useRef(false);

  useEffect(() => {
    // StrictMode ejecuta el efecto dos veces y el token de FileMaker es de un solo uso.
    if (peticionEnviada.current) return;
    peticionEnviada.current = true;

    const parametrosUrl = new URLSearchParams(window.location.search);
    const tokenFileMaker = parametrosUrl.get("token");
    const tenant = parametrosUrl.get("tenant");
    const reporteInicio = parametrosUrl.get("report");

    const autenticarUsuario = async () => {
      if (tokenFileMaker) {
        try {
          const { user } = await apiFetch<{ user: UsuarioSesion }>(
            "/auth/login-token",
            { method: "POST", body: { token: tokenFileMaker, tenant } },
            SIN_MANEJO_401,
          );
          guardarUsuario(user);
          window.history.replaceState({}, document.title, window.location.pathname);
          setSesion({ tenant: user.tenant ?? tenant, reporteInicio });
        } catch (error) {
          setErrorAutenticacion(
            error instanceof ApiError
              ? "El enlace de acceso ya no es válido. Vuelve a abrir el reporte desde FileMaker."
              : "No se pudo conectar con el servidor. Revisa tu conexión y vuelve a abrir el reporte desde FileMaker.",
          );
        }
        return;
      }

      // El usuario guardado (no sensible) solo indica que vale la pena
      // preguntarle al backend si la cookie de sesión sigue vigente.
      const usuarioGuardado = leerUsuario();
      if (!usuarioGuardado) {
        setErrorAutenticacion(
          tenant
            ? SIN_SESION
            : "Ruta no encontrada. Por favor, abre el reporte desde FileMaker.",
        );
        return;
      }

      try {
        await apiFetch("/auth/me", {}, SIN_MANEJO_401);
        setSesion({ tenant: usuarioGuardado.tenant ?? null, reporteInicio });
      } catch {
        setErrorAutenticacion(SIN_SESION);
      }
    };

    void autenticarUsuario();
  }, []);

  if (errorAutenticacion) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <KeyRound className="h-7 w-7 text-blue-600" aria-hidden="true" />
          </div>
          <h1 className="mb-3 text-xl font-bold text-gray-800">
            Sesión no disponible
          </h1>
          <p className="mb-8 text-gray-600 leading-relaxed">
            {errorAutenticacion}
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = `https://99soluciones.com`)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-marca-morado focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            Regresar a la aplicación
          </button>
        </div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin motion-reduce:animate-none rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Validando credenciales...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children(sesion)}
      <AvisoSesionExpirada />
    </>
  );
};

export default AuthGate;
