interface NavVarProps {
  toggleSidebar: () => void;
  /**
   * Recibe el elemento del slot central donde los reportes montan su
   * encabezado vía portal (ver EncabezadoReporte.tsx). Layout lo guarda en estado y lo
   * distribuye con NavbarSlotContext.
   */
  reportSlotRef: (el: HTMLElement | null) => void;
}

const USUARIO_STORAGE_KEY = "usuario:v1";
const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

const cerrarSesion = async () => {
  try {
    // Limpia la cookie httpOnly en el backend; el frontend ya no puede
    // borrarla directamente.
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Si el backend no responde, igual limpiamos localmente y salimos.
  }
  localStorage.removeItem("jwt_reportes");
  localStorage.removeItem(USUARIO_STORAGE_KEY);
  localStorage.removeItem("usuario");
  window.location.href = `https://99soluciones.com`;
};

const Navbar = ({ toggleSidebar, reportSlotRef } : NavVarProps) => {
  // Respaldo a la clave vieja sin versión mientras las sesiones activas
  // anteriores a este cambio siguen vigentes.
  const usuario =
    localStorage.getItem(USUARIO_STORAGE_KEY) ?? localStorage.getItem("usuario");
  const nombreUsuario = usuario ? JSON.parse(usuario).name : "Usuario";

  return (
    <header className="min-h-16 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-y-1 py-1 px-4 sm:px-6 shadow-sm z-10 shrink-0">
      {/* Contenedor Izquierdo: Botón Hamburguesa + Logo */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggleSidebar}
          className="mr-4 text-gray-500 hover:text-blue-600 focus:outline-none rounded p-1 transition-colors"
          title="Alternar Menú"
        >
          {/* Icono de Hamburguesa */}
          <svg
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
        <span className="hidden sm:inline-block text-sm text-blue-700 font-medium">
          {nombreUsuario}
        </span>
        <button
          type="button"
          onClick={cerrarSesion}
          className="text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Navbar;
