import React from "react";
import { AgGridReact } from "ag-grid-react";
import toast from "react-hot-toast";
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
    <>
    {/* Verde 700 en reposo: el blanco sobre el 600 da 3.77:1 (el mínimo AA es 4.5:1). */}
    <button
      type="button"
      // aria-disabled y no disabled: sigue en el orden de tabulación, así el
      // motivo llega por teclado y lector de pantalla (un title no).
      aria-disabled={motivoDeshabilitado ? true : undefined}
      aria-describedby="exportar-descripcion"
      className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 aria-disabled:opacity-40 aria-disabled:hover:bg-emerald-700 aria-disabled:cursor-not-allowed text-white font-medium py-1.5 px-3 pointer-coarse:min-h-10 rounded-lg shadow-sm shrink-0 transition-colors text-center text-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      onClick={(e) => {
        if (motivoDeshabilitado) toast(motivoDeshabilitado, { id: "exportar-deshabilitado" });
        else exportar(e);
      }}
    >
      <svg
        aria-hidden="true"
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
      {/* Un solo texto: el nombre accesible es "Exportar CSV" (en teléfono se ve "Exportar"). */}
      <span>
        Exportar{" "}
        <span className="hidden sm:inline">CSV</span>
      </span>
    </button>
    {/* Fuera del botón: dentro, la descripción formaba parte de su nombre. */}
    <span id="exportar-descripcion" className="sr-only">
      {descripcion}
    </span>
    </>
  );
};

export default BotonExportar;
