import { NavLink } from "react-router-dom";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChartColumn,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  ShoppingCart,
  Store,
  type LucideIcon,
} from "lucide-react";

interface Reporte {
  to: string;
  nombre: string;
  Icono: LucideIcon;
  /** Todavía no existe: dice "Próximamente" bajo (o junto a) su nombre. */
  proximamente?: boolean;
}

/** Los reportes del menú, en orden. El drawer y el riel salen de esta lista. */
const REPORTES: Reporte[] = [
  { to: "/bancos", nombre: "Bancos", Icono: CreditCard },
  { to: "/ventas", nombre: "Ventas", Icono: ChartColumn },
  { to: "/cuentas_por_cobrar", nombre: "Cuentas por cobrar", Icono: CircleDollarSign },
  // Entra dinero / sale dinero: con solo el ícono (riel) tienen que distinguirse.
  { to: "/flujo_efectivo_ingresos", nombre: "Flujo de efectivo - Ingresos", Icono: BanknoteArrowDown },
  { to: "/flujo_efectivo_egresos", nombre: "Flujo de efectivo - Egresos", Icono: BanknoteArrowUp },
  { to: "/compras", nombre: "Compras", Icono: ShoppingCart },
  { to: "/cuentas_por_pagar", nombre: "Cuentas por pagar", Icono: HandCoins },
  { to: "/inventarios", nombre: "Inventarios", Icono: Store, proximamente: true },
];

const ACTIVO = "bg-blue-50 text-blue-700";
const INACTIVO = "text-gray-600 hover:bg-gray-50 hover:text-blue-600";
const FOCO = "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

interface SidebarProps {
  isOpen: boolean;
  /** Al elegir un reporte el menú se cierra y deja ver la tabla. */
  onNavegar?: () => void;
}

const Sidebar = ({ isOpen, onNavegar } : SidebarProps) => (
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

      {REPORTES.map(({ to, nombre, Icono, proximamente }) => (
        <NavLink
          key={to}
          onClick={onNavegar}
          to={to}
          className={({ isActive }) =>
            `flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors mb-1 ${FOCO} ${
              isActive ? ACTIVO : INACTIVO
            }`
          }
        >
          <Icono aria-hidden="true" className="w-5 h-5 mr-3 shrink-0" />
          {proximamente ? (
            <span className="flex min-w-0 flex-col">
              <span>{nombre}</span>
              <span className="text-xs font-normal text-gray-500">Próximamente</span>
            </span>
          ) : (
            <span>{nombre}</span>
          )}
        </NavLink>
      ))}
    </nav>
  </aside>
);

/**
 * Desde xl, con el menú cerrado, los reportes quedan a un clic en una columna
 * de íconos. El nombre aparece al pasar el cursor o con el foco (no en
 * `title`: no llega por teclado). Con el menú abierto el drawer lo tapa y
 * queda inerte, como el reporte.
 */
export const RielReportes = ({ inert }: { inert: boolean }) => (
  <nav
    aria-label="Accesos rápidos a reportes"
    inert={inert}
    className="hidden xl:flex w-14 shrink-0 flex-col items-center gap-1 border-r border-gray-200 bg-white py-3"
  >
    {REPORTES.map(({ to, nombre, Icono, proximamente }) => {
      const etiqueta = proximamente ? `${nombre} · Próximamente` : nombre;
      return (
        <NavLink
          key={to}
          to={to}
          aria-label={etiqueta}
          className={({ isActive }) =>
            `group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${FOCO} ${
              isActive ? ACTIVO : INACTIVO
            }`
          }
        >
          <Icono aria-hidden="true" className="w-5 h-5" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 shadow-lg group-hover:block group-focus-visible:block"
          >
            {etiqueta}
          </span>
        </NavLink>
      );
    })}
  </nav>
);

export default Sidebar;
