import React, { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AgGridReact } from "ag-grid-react";

import { useNavbarSlot } from "../../../layout/navbarSlotContext";

interface EncabezadoReporteProps {
  titulo: string;
  encabezadoExtra?: ReactNode;
  referenciaGrid: React.RefObject<AgGridReact | null>;
  textoBusqueda: string;
  setTextoBusqueda: (val: string) => void;
  setBusquedaActiva: (val: string) => void;
  modeloFiltros: Record<string, unknown>;
  setModeloFiltros: (val: Record<string, unknown>) => void;
  setPaginaActual: (val: number) => void;
}

/**
 * Encabezado del reporte (título + extras como los tabs de Ventas). Se monta
 * en el slot central del Navbar vía portal; el rango de fechas vive aparte en
 * FiltroFechas, dentro de la barra de controles de la tabla.
 */
const EncabezadoReporte = ({
  titulo,
  encabezadoExtra,
  referenciaGrid,
  textoBusqueda,
  setTextoBusqueda,
  setBusquedaActiva,
  modeloFiltros,
  setModeloFiltros,
  setPaginaActual,
}: EncabezadoReporteProps) => {
  // Layout provee el elemento del slot por contexto. Es null si el Layout no
  // está montado (tests).
  const slotNavbar = useNavbarSlot();

  const encabezado = (
    <div className="flex flex-wrap items-center gap-3 min-w-0">
      <h2 className="text-lg font-bold text-gray-800 truncate sm:text-xl">
        {titulo}
      </h2>
      {encabezadoExtra ? (
        <div className="shrink-0">{encabezadoExtra}</div>
      ) : null}
    </div>
  );

  if (slotNavbar) {
    return createPortal(encabezado, slotNavbar);
  }

  //De momento se oculta la barra de búsqueda global
  const mostrarBarraBusqueda = false;

  // Fallback inline: mismo encabezado sobre el contenido cuando el slot del
  // Navbar no existe (por ejemplo en tests que montan el reporte solo).
  return (
    <div className="flex flex-col p-4 pt-4 pb-2 gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        {encabezado}
      </div>

      {/* Barra de Búsqueda Global (oculta de momento) */}
      {mostrarBarraBusqueda && (
        <div className="relative w-full max-w-lg shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            aria-label="Buscar registro"
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Buscar registro..."
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setBusquedaActiva(textoBusqueda);
                setPaginaActual(1);
              }
            }}
          />
          {/* Botón limpiar */}
          {(textoBusqueda || Object.keys(modeloFiltros).length > 0) && (
            <button
              type="button"
              onClick={() => {
                setTextoBusqueda("");
                setBusquedaActiva("");
                setModeloFiltros({});
                if (referenciaGrid.current)
                  referenciaGrid.current.api.setFilterModel(null);
                setPaginaActual(1);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors"
              title="Limpiar filtros"
              aria-label="Limpiar filtros"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EncabezadoReporte;
