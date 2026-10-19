import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  /** Al elegir un reporte el menú se cierra y deja ver la tabla. */
  onNavegar?: () => void;
}

const Sidebar = ({ isOpen, onNavegar } : SidebarProps) => {
  const baseClass =
    "flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
  const activeClass = "bg-blue-50 text-blue-700";
  const inactiveClass = "text-gray-600 hover:bg-gray-50 hover:text-blue-600";

  return (
    <aside
      id="menu-reportes"
      aria-label="Menú de reportes"
      // Cerrado solo se desplaza fuera de pantalla: inert lo saca del orden de
      // tabulación y del árbol de accesibilidad.
      inert={!isOpen}
      className={`
        absolute top-0 left-0 h-full z-100
        w-72 bg-white border-r border-gray-200 flex flex-col shadow-2xl 
        transition-transform duration-300 ease-in-out motion-reduce:transition-none
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <nav className="flex-1 px-4 py-4 overflow-y-auto mt-2">
        <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Reportes financieros
        </p>

        <NavLink
          onClick={onNavegar}
          to="/bancos"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5 mr-3 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            ></path>
          </svg>
          <span>Bancos</span>
        </NavLink>

        <NavLink
          onClick={onNavegar}
          to="/ventas"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5 mr-3 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
          <span>Ventas</span>
        </NavLink>

        <NavLink
          onClick={onNavegar}
          to="/cuentas_por_cobrar"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mr-3 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          {/* Dos líneas, no una pastilla al lado: en el ancho del menú se pegaban. */}
          <span className="flex min-w-0 flex-col">
            <span>Cuentas por cobrar</span>
            <span className="text-xs font-normal text-gray-500">Próximamente</span>
          </span>
        </NavLink>

        <NavLink
          onClick={onNavegar}
          to="/inventarios"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mr-3 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
            />
          </svg>

          <span className="flex min-w-0 flex-col">
            <span>Inventarios</span>
            <span className="text-xs font-normal text-gray-500">Próximamente</span>
          </span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
