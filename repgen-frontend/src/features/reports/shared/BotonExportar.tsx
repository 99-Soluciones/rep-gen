import React from "react";
import { AgGridReact } from "ag-grid-react";
import { exportarDatos } from "./ag-grid/exportar";

interface BotonExportarProps {
  referenciaGrid: React.RefObject<AgGridReact | null>;
  nombreArchivo: string;
}

/**
 * Botón de exportación a Excel. Vive en su propio slot al final de la barra de
 * la tabla (`accionesToolbarFin`) para quedar siempre como la acción más a la
 * derecha, después de los selectores de densidad y registros.
 */
const BotonExportar = ({ referenciaGrid, nombreArchivo }: BotonExportarProps) => {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg shadow-sm shrink-0 transition-colors text-center text-sm whitespace-nowrap"
      onClick={exportarDatos(referenciaGrid, nombreArchivo)}
    >
      <svg
        className="w-4 h-4 text-emerald-100"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span className="hidden sm:block">Exportar a Excel</span>
      <span className="block sm:hidden">Exportar</span>
    </button>
  );
};

export default BotonExportar;
