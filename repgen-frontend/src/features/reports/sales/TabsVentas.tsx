import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { usePopoverAnclado } from "../../../shared/utils/usePopoverAnclado";

interface Pestana {
  /** Último segmento de la ruta: `${rutaBase}/${ruta}`. */
  ruta: string;
  etiqueta: string;
}

const PESTANAS_VENTAS: Pestana[] = [
  { ruta: "facturas", etiqueta: "Facturas" },
  { ruta: "conceptos", etiqueta: "Conceptos" },
];

interface TabsVentasProps {
  reportType: string;
  /** Otro reporte con pestañas (Flujo de efectivo - Ingresos, Bancos). */
  rutaBase?: string;
  pestanas?: Pestana[];
}

const TabsVentas = ({ reportType, rutaBase = "/ventas", pestanas = PESTANAS_VENTAS }: TabsVentasProps) => {
  const actual = pestanas.find((p) => p.ruta === reportType)?.etiqueta ?? pestanas[0].etiqueta;

  const [menuAbierto, setMenuAbierto] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const popover = usePopoverAnclado(botonRef, () => setMenuAbierto(false));

  // Al abrir, el foco entra en la pestaña actual (como el menú lateral).
  useEffect(() => {
    if (menuAbierto) menuRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
  }, [menuAbierto]);

  return (
    <div className="flex items-center gap-2">
      <div className="sm:hidden flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            ref={botonRef}
            type="button"
            className="h-10 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={menuAbierto}
            aria-controls="menu-tabs-ventas"
            aria-label={`Tipo de reporte: ${actual}`}
            onClick={() => setMenuAbierto((prev) => !prev)}
          >
            {actual}
            <ChevronDown aria-hidden="true" className="h-4 w-4 text-gray-400" />
          </button>
          {menuAbierto ? (
            <div
              id="menu-tabs-ventas"
              // Escape y clic fuera los resuelve el navegador (popover="auto").
              {...popover}
              className="popover-anclado w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
            >
              {/* Navegan: son links (aria-current lo pone NavLink), no un listbox. */}
              {pestanas.map(({ ruta, etiqueta }) => (
                <NavLink
                  key={ruta}
                  to={`${rutaBase}/${ruta}`}
                  onClick={() => setMenuAbierto(false)}
                  className={({ isActive }) =>
                    `block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  {etiqueta}
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="hidden sm:inline-flex rounded-xl bg-white border border-gray-200 p-1 shadow-sm">
        {pestanas.map(({ ruta, etiqueta }) => (
          <NavLink
            key={ruta}
            to={`${rutaBase}/${ruta}`}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:text-blue-600"
              }`
            }
          >
            {etiqueta}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default TabsVentas;
