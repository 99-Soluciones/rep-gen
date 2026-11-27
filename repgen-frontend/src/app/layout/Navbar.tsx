import { apiFetch } from "../../shared/api/http";
import { borrarUsuario, leerUsuario } from "../../features/auth/session";
import { salir } from "../../shared/utils/salidaProtegida";
import { nombrePropio } from "../../shared/utils/nombrePropio";
import { Menu } from "lucide-react";

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
  const empresa = usuario?.tenant ? nombrePropio(usuario.tenant) : null;
  const nombreUsuario = nombrePropio(usuario?.name ?? "Usuario");

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
          <Menu aria-hidden="true" className="w-6 h-6" />
        </button>

        <img src="/favicon.svg" alt="RepGen" className="w-12 h-12" />
      </div>

      {/* Slot central: cada reporte monta aquí su encabezado vía portal. Bajo
          lg (también una laptop al 200% de zoom) baja a su propia fila: título,
          tabs, usuario y salir no caben juntos. */}
      <div
        ref={reportSlotRef}
        className="order-last w-full lg:order-0 lg:w-auto lg:flex-1 min-w-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 lg:mx-4"
      />

      {/* Contenedor Derecho: Controles de usuario */}
      {/* Sesión: empresa (la base de FileMaker) arriba y quién la usa abajo.
          Bajo lg solo cabe la empresa. */}
      <div className="flex items-center gap-3 lg:border-l lg:border-gray-200 lg:pl-4">
        <div className="flex min-w-0 flex-col leading-tight">
          {empresa && (
            <span className="max-w-32 sm:max-w-48 truncate text-sm font-semibold text-gray-800" title={empresa}>
              <span className="sr-only">Empresa: </span>
              {empresa}
            </span>
          )}
          <span className="hidden lg:block max-w-48 truncate text-xs text-gray-500" title={nombreUsuario}>
            <span className="sr-only">Usuario: </span>
            {nombreUsuario}
          </span>
        </div>
        <button
          type="button"
          // Con una vista sin guardar, el selector de vistas pregunta antes.
          onClick={() => salir({ motivo: "sesion", continuar: () => void cerrarSesion() })}
          className="text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
};

export default Navbar;
