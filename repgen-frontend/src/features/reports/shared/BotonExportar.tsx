import React from "react";
import { AgGridReact } from "ag-grid-react";
import { exportarDatos } from "./ag-grid/exportar";

interface BotonExportarProps {
  referenciaGrid: React.RefObject<AgGridReact | null>;
  nombreArchivo: string;
  /** Motivo por el que no se puede exportar (cargando, error, sin registros); null = habilitado. */
  motivoDeshabilitado?: string | null;
}

/**
 * Botón de exportación (CSV que abre Excel). Vive en su propio slot al final de
 * la barra de la tabla (`accionesToolbarFin`) para quedar siempre como la
 * acción más a la derecha.
 */
const BotonExportar = ({
  referenciaGrid,
  nombreArchivo,
  motivoDeshabilitado = null,
}: BotonExportarProps) => {
  const exportar = exportarDatos(referenciaGrid, nombreArchivo);
  // CSV y no .xlsx: Excel lo abre directo. Se dice qué incluye antes de bajarlo.
  const descripcion =
    motivoDeshabilitado ??
    "Descarga las filas filtradas con las columnas visibles, sin la fila de totales. Se abre en Excel.";
  return (
    <button
      type="button"
      // aria-disabled y no disabled: sigue en el orden de tabulación, así el
      // motivo llega por teclado y lector de pantalla (un title no).
      aria-disabled={motivoDeshabilitado ? true : undefined}
      aria-describedby="exportar-descripcion"
      title={descripcion}
      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 aria-disabled:opacity-40 aria-disabled:hover:bg-emerald-600 aria-disabled:cursor-not-allowed text-white font-medium py-1.5 px-3 rounded-lg shadow-sm shrink-0 transition-colors text-center text-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      onClick={(e) => {
        if (!motivoDeshabilitado) exportar(e);
      }}
    >
      <span id="exportar-descripcion" className="sr-only">
        {descripcion}
      </span>
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
      <span className="hidden sm:block">Exportar CSV</span>
      <span className="block sm:hidden">Exportar</span>
    </button>
  );
};

export default BotonExportar;
