import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useBlocker,
} from "react-router-dom";
import Layout from "./layout/Layout";
import ReporteBancos from "../features/reports/banks/ReporteBancos";
import ReporteVentas from "../features/reports/sales/ReporteVentas";
import ComingSoon from "../shared/ui/ComingSoon/ComingSoon";
import { hayTrabajoSinGuardar, salir } from "../shared/utils/salidaProtegida";

// "/ventas/facturas" y "/ventas/conceptos" son el mismo reporte: cada pestaña
// recuerda sus columnas y filtros, así que cambiar entre ellas no pierde nada.
const seccion = (ruta: string) => ruta.split("/")[1] ?? "";

/**
 * Ir a otro reporte (menú, atrás del navegador) con una vista sin guardar:
 * se detiene la navegación y pregunta el selector de vistas (salidaProtegida).
 */
export const GuardiaSalida = () => {
  const bloqueo = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hayTrabajoSinGuardar() && seccion(currentLocation.pathname) !== seccion(nextLocation.pathname),
  );

  useEffect(() => {
    if (bloqueo.state !== "blocked") return;
    salir({ motivo: "reporte", continuar: bloqueo.proceed, cancelar: bloqueo.reset });
  }, [bloqueo]);

  return null;
};

const crearRouter = (reporteInicio: string | null) => {
  const rutaInicio = reporteInicio === "ventas" ? "ventas/facturas" : reporteInicio;

  // Router de datos (no <BrowserRouter>): useBlocker solo funciona con él.
  return createBrowserRouter([
    {
      element: (
        <Layout>
          <Outlet />
          <GuardiaSalida />
        </Layout>
      ),
      // Un error al pintar un reporte no deja la página en blanco ni muestra la
      // pantalla técnica de React Router: la hoja de estado vacío, con salida.
      errorElement: (
        <Layout>
          <ComingSoon
            titulo="No se pudo mostrar este reporte"
            mensaje="Algo falló al dibujarlo. Recarga la página; si se repite, elige otro reporte desde el menú."
            recargar
          />
        </Layout>
      ),
      children: [
        { path: "/", element: <Navigate to={`/${rutaInicio || "bancos"}`} /> },
        { path: "/bancos", element: <ReporteBancos /> },
        { path: "/ventas", element: <Navigate to="/ventas/facturas" replace /> },
        { path: "/ventas/:reportType", element: <ReporteVentas /> },
        { path: "/cuentas_por_cobrar", element: <ComingSoon /> },
        { path: "/inventarios", element: <ComingSoon /> },
        {
          path: "*",
          element: (
            <ComingSoon
              titulo="Esta página no existe"
              mensaje="Revisa el enlace o elige un reporte desde el menú."
            />
          ),
        },
      ],
    },
  ]);
};

const AppRouter = ({ reporteInicio }: { reporteInicio: string | null }) => {
  // Un solo router por sesión: recrearlo reiniciaría la navegación.
  const [router] = useState(() => crearRouter(reporteInicio));
  return <RouterProvider router={router} />;
};

export default AppRouter;
