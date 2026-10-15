import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

interface TabsVentasProps {
  reportType: "facturas" | "conceptos";
}

const TabsVentas = ({ reportType }: TabsVentasProps) => {
    
  const [menuAbierto, setMenuAbierto] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAbierto) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuAbierto(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuAbierto]);

  return (
    <div className="flex items-center gap-2">
      <div className="sm:hidden flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="h-10 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={menuAbierto}
            aria-controls="menu-tabs-ventas"
            aria-label={`Tipo de reporte: ${reportType === "facturas" ? "Facturas" : "Conceptos"}`}
            onClick={() => setMenuAbierto((prev) => !prev)}
          >
            {reportType === "facturas" ? "Facturas" : "Conceptos"}
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {menuAbierto ? (
            <div
              id="menu-tabs-ventas"
              className="absolute left-0 mt-2 w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-lg z-20"
            >
              {/* Navegan: son links (aria-current lo pone NavLink), no un listbox. */}
              {(["facturas", "conceptos"] as const).map((tipo) => (
                <NavLink
                  key={tipo}
                  to={`/ventas/${tipo}`}
                  onClick={() => setMenuAbierto(false)}
                  className={({ isActive }) =>
                    `block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  {tipo === "facturas" ? "Facturas" : "Conceptos"}
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="hidden sm:inline-flex rounded-xl bg-white border border-gray-200 p-1 shadow-sm">
        <NavLink
          to="/ventas/facturas"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              isActive
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-blue-600"
            }`
          }
        >
          Facturas
        </NavLink>
        <NavLink
          to="/ventas/conceptos"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              isActive
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-blue-600"
            }`
          }
        >
          Conceptos
        </NavLink>
      </div>
    </div>
  );
};

export default TabsVentas;
