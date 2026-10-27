import { NavLink } from "react-router-dom";
import { ChartColumn, CircleDollarSign, CreditCard, Store } from "lucide-react";

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
          <CreditCard aria-hidden="true" className="w-5 h-5 mr-3 shrink-0" />
          <span>Bancos</span>
        </NavLink>

        <NavLink
          onClick={onNavegar}
          to="/ventas"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <ChartColumn aria-hidden="true" className="w-5 h-5 mr-3 shrink-0" />
          <span>Ventas</span>
        </NavLink>

        <NavLink
          onClick={onNavegar}
          to="/cuentas_por_cobrar"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <CircleDollarSign aria-hidden="true" className="w-5 h-5 mr-3 shrink-0" />
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
          <Store aria-hidden="true" className="w-5 h-5 mr-3 shrink-0" />

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
