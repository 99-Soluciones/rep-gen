import type { ReactNode } from "react";

interface TablaDinamicaControlesProps {
  totalDatos: number;
  filasVisibles: number;
  /** Columnas con filtro activo (pueden estar fuera de pantalla). */
  filtrosActivos?: number;
  onLimpiarFiltros?: () => void;
  /** Presente tras "Limpiar" mientras se puedan recuperar los filtros quitados. */
  onRestaurarFiltros?: () => void;
  accionesToolbarInicio?: ReactNode;
  accionesToolbar?: ReactNode;
  accionesToolbarFin?: ReactNode;
}

// El endpoint siempre trae todos los registros del rango de fechas, así que el
// contador refleja lo cargado en el grid.
const TablaDinamicaControles = ({
  totalDatos,
  filasVisibles,
  filtrosActivos = 0,
  onLimpiarFiltros,
  onRestaurarFiltros,
  accionesToolbarInicio,
  accionesToolbar,
  accionesToolbarFin,
}: TablaDinamicaControlesProps) => {
  // Un filtro puede estar activo aunque todavía coincidan todas las filas.
  const hayFiltroActivo = filtrosActivos > 0 || filasVisibles !== totalDatos;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 border-b border-gray-100 bg-white">
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        {accionesToolbarInicio}
        <div
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm whitespace-nowrap transition-colors ${
            hayFiltroActivo
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-gray-50 border-gray-200 text-gray-600"
          }`}
        >
          {hayFiltroActivo && (
            <svg
              className="w-3.5 h-3.5 text-blue-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4h18M6 8h12M9 12h6M11 16h2"
              />
            </svg>
          )}
          <span aria-live="polite">
            <span className={`font-semibold ${hayFiltroActivo ? "text-blue-800" : "text-gray-900"}`}>
              {filasVisibles.toLocaleString("es-MX")}
            </span>
            {hayFiltroActivo && (
              <span className="text-gray-500"> de {totalDatos.toLocaleString("es-MX")}</span>
            )}{" "}
            {filasVisibles === 1 ? "registro" : "registros"}
            {filtrosActivos > 0 && (
              <span className="text-gray-500">
                {" · "}
                {filtrosActivos} {filtrosActivos === 1 ? "filtro" : "filtros"}
              </span>
            )}
          </span>
          {filtrosActivos > 0 && onLimpiarFiltros && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="ml-1 rounded font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Limpiar
            </button>
          )}
          {filtrosActivos === 0 && onRestaurarFiltros && (
            <button
              type="button"
              onClick={onRestaurarFiltros}
              className="ml-1 rounded font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Restaurar filtros
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-2">
        {accionesToolbar}
        {accionesToolbarFin}
      </div>
    </div>
  );
};

export default TablaDinamicaControles;
