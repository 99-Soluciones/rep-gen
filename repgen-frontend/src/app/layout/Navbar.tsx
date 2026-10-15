import { apiFetch } from "../../shared/api/http";
import { borrarUsuario, leerUsuario } from "../../features/auth/session";

interface NavVarProps {
  toggleSidebar: () => void;
  sidebarAbierto: boolean;
  /**
   * Recibe el elemento del slot central donde los reportes montan su
   * encabezado vía portal (ver EncabezadoReporte.tsx). Layout lo guarda en estado y lo
   * distribuye con NavbarSlotContext.
   */
  reportSlotRef: (el: HTMLElement | null) => void;
}

const cerrarSesion = async () => {
  try {
    // Limpia la cookie httpOnly en el backend; el frontend ya no puede
    // borrarla directamente.
    await apiFetch("/auth/logout", { method: "POST" }, { manejarSesionExpirada: false });
  } catch {
    // Si el backend no responde, igual limpiamos localmente y salimos.
  }
  borrarUsuario();
  window.location.href = `https://99soluciones.com`;
};

const Navbar = ({ toggleSidebar, sidebarAbierto, reportSlotRef } : NavVarProps) => {
  const usuario = leerUsuario();
  const nombreUsuario = usuario?.name ?? "Usuario";

  return (
    <header className="min-h-16 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-y-1 py-1 px-4 sm:px-6 shadow-sm z-10 shrink-0">
      {/* Contenedor Izquierdo: Botón Hamburguesa + Logo */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggleSidebar}
          className="mr-4 text-gray-500 hover:text-blue-600 rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Menú de reportes"
          aria-expanded={sidebarAbierto}
          aria-controls="menu-reportes"
        >
          {/* Icono de Hamburguesa */}
          <svg
            aria-hidden="true"
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <img src="/favicon.svg" alt="RepGen" className="w-12 h-12" />
      </div>

      {/* Slot central: cada reporte monta aquí su encabezado vía portal */}
      <div
        ref={reportSlotRef}
        className="order-last w-full sm:order-0 sm:w-auto sm:flex-1 min-w-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:mx-4"
      />

      {/* Contenedor Derecho: Controles de usuario */}
      <div className="flex items-center space-x-4">
        {usuario?.tenant && (
          <span className="sm:hidden max-w-32 truncate text-xs text-gray-500">
            {usuario.tenant}
          </span>
        )}
        <span className="hidden sm:inline-block text-sm text-gray-700">
          <span className="font-medium">{nombreUsuario}</span>
          {usuario?.tenant && (
            <span className="text-gray-500"> · {usuario.tenant}</span>
          )}
        </span>
        <button
          type="button"
          onClick={cerrarSesion}
          className="text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
};

export default Navbar;
