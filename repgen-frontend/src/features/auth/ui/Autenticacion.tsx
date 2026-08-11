import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import ReporteBancos from "../../reports/banks/ui/ReporteBancos";
import Layout from "../../../app/layout/Layout";
import ReporteVentas from "../../reports/sales/ui/ReporteVentas";
import ComingSoon from "../../../shared/ui/ComingSoon/ComingSoon";
import { ColumnLabelsProvider } from "../../reports/shared/context/ColumnLabelsProvider";

const USUARIO_STORAGE_KEY = "usuario:v1";

// Migración: hasta que todas las sesiones activas se renueven, seguimos
// leyendo la clave vieja sin versión como respaldo para no cerrar sesión a
// usuarios que ya tenían el token guardado antes de este cambio.
const leerUsuarioGuardado = (): string | null =>
  localStorage.getItem(USUARIO_STORAGE_KEY) ?? localStorage.getItem("usuario");

const obtenerTenantActivo = (): string | null => {
  try {
    const usuario = leerUsuarioGuardado();
    if (!usuario) return null;
    const parsed = JSON.parse(usuario) as { tenant?: string };
    return parsed.tenant ?? null;
  } catch {
    return null;
  }
};

interface ErrorAutenticacion {
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

const AuthHandler = () => {
  const [, setAutenticado] = useState(false);
  const [estaCargando, setEstaCargando] = useState(true);
  const [errorAutenticacion, setErrorAutenticacion] =
    useState<ErrorAutenticacion | null>(null);

  const peticionEnviada = useRef(false);
  const [reporteInicio, setReporteInicio] = useState<string | null>(null);
  const [tenantActivo, setTenantActivo] = useState<string | null>(() =>
    obtenerTenantActivo(),
  );

  useEffect(() => {
    const autenticarUsuario = async () => {
      if (peticionEnviada.current) return;
      const parametrosUrl = new URLSearchParams(window.location.search);
      const tokenFileMaker = parametrosUrl.get("token");
      const tenant = parametrosUrl.get("tenant");
      const report = parametrosUrl.get("report");
      setReporteInicio(report);
      // El JWT ahora vive en una cookie httpOnly, invisible para JS. Usamos
      // el usuario cacheado (no sensible) solo como pista de que vale la
      // pena preguntarle al backend si la sesión sigue vigente.
      const usuarioGuardado = leerUsuarioGuardado();

      if (!tokenFileMaker && !tenant && !usuarioGuardado) {
        setErrorAutenticacion({
          message:
            "Ruta no encontrada. Por favor, abre el reporte desde FileMaker.",
        });
        setEstaCargando(false);
        return;
      }

      if (tokenFileMaker) {
        peticionEnviada.current = true;

        try {
          const respuesta = await fetch(`${API_URL}/auth/login-token`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: tokenFileMaker, tenant: tenant }),
          });

          if (respuesta.ok) {
            const { user } = await respuesta.json();

            localStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(user));
            setTenantActivo(user.tenant ?? tenant ?? null);

            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );

            setAutenticado(true);
          } else {
            setErrorAutenticacion({ message: "Token inválido o expirado" });
          }
        } catch (err) {
          setErrorAutenticacion({ message: (err as Error).message });
        }
        setEstaCargando(false);
      } else if (usuarioGuardado) {
        try {
          const respuestaMe = await fetch(`${API_URL}/auth/me`, {
            credentials: "include",
          });
          if (respuestaMe.ok) {
            setTenantActivo(obtenerTenantActivo());
            setAutenticado(true);
          } else {
            setErrorAutenticacion({
              message:
                "No hay sesión activa. Por favor, abre el reporte desde FileMaker.",
            });
          }
        } catch {
          setErrorAutenticacion({
            message:
              "No hay sesión activa. Por favor, abre el reporte desde FileMaker.",
          });
        }
        setEstaCargando(false);
      } else {
        setErrorAutenticacion({
          message:
            "No hay sesión activa. Por favor, abre el reporte desde FileMaker.",
        });
        setEstaCargando(false);
      }
    };

    autenticarUsuario();
  }, []);

  if (estaCargando) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Validando credenciales...</p>
        </div>
      </div>
    );
  }

  if (errorAutenticacion) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-800">
            Acceso Denegado
          </h2>
          <p className="mb-8 text-gray-600 leading-relaxed">
            {errorAutenticacion.message}
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = `https://99soluciones.com`)}
            className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            Regresar a la aplicación
          </button>
        </div>
      </div>
    );
  }

  const rutaInicio =
    reporteInicio === "ventas" ? "ventas/facturas" : reporteInicio;

  return (
    <ColumnLabelsProvider tenant={tenantActivo}>
      <BrowserRouter>
        <Layout>
          <Routes>
          <Route path="/" element={<Navigate to={`/${rutaInicio || "bancos"}`} />} />
          <Route path="/bancos" element={<ReporteBancos />} />
          <Route
            path="/ventas"
            element={<Navigate to="/ventas/facturas" replace />}
          />
          <Route
            path="/ventas/:reportType"
            element={<ReporteVentas />}
          />
          <Route path="/cuentas_por_cobrar" element={<ComingSoon />} />
          <Route path="/inventarios" element={<ComingSoon />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ColumnLabelsProvider>
  );
};

export default AuthHandler;
