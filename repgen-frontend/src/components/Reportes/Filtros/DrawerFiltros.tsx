import { useState } from "react";
import toast from "react-hot-toast";
import { obtenerFechaHoyFormateada } from "../../../utils/dateFormatted";

interface DrawerFiltrosProps {
  abierto: boolean;
  onCerrar: () => void;
  fechaDesde: string;
  setFechaDesde: (val: string) => void;
  fechaHasta: string;
  setFechaHasta: (val: string) => void;
  setPaginaActual: (val: number) => void;
}

const DrawerFiltros = ({
  abierto,
  onCerrar,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  setPaginaActual,
} : DrawerFiltrosProps) => {
  const [borradorFechas, setBorradorFechas] = useState({
    fechaDesde: fechaDesde,
    fechaHasta: fechaHasta,
  });

  const handleCerrar = () => {
    setBorradorFechas({ fechaDesde, fechaHasta });
    onCerrar();
  };

  return (
    <>
      {/* Drawer Overlay */}
      <button
        type="button"
        aria-label="Cerrar filtros"
        tabIndex={abierto ? 0 : -1}
        className={`fixed inset-0 z-40 cursor-default bg-gray-900/40 backdrop-blur-sm transition-opacity duration-500 ${
          abierto ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleCerrar}
      />

      {/* Drawer Lateral */}
      <div
        className={`fixed inset-y-0 left-0 z-100 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtros del Reporte
          </h3>
          <button
            type="button"
            onClick={handleCerrar}
            aria-label="Cerrar filtros"
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <svg
              className="hidden sm:block w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
            <svg
              className="block sm:hidden w-6 h-6"
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {/* Rango de Fechas */}
          <div>
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Rango de Fechas
            </h4>
            <div className="flex flex-col gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 mb-1">
                  Desde:
                </span>
                <input
                  type="date"
                  aria-label="Fecha desde"
                  max={borradorFechas.fechaHasta || obtenerFechaHoyFormateada()}
                  value={borradorFechas.fechaDesde}
                  onChange={(e) => {
                    setBorradorFechas((prev) => ({
                      ...prev,
                      fechaDesde: e.target.value,
                    }));
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 mb-1">
                  Hasta:
                </span>
                <input
                  type="date"
                  aria-label="Fecha hasta"
                  min={borradorFechas.fechaDesde}
                  max={obtenerFechaHoyFormateada()}
                  value={borradorFechas.fechaHasta}
                  onChange={(e) => {
                    setBorradorFechas((prev) => ({
                      ...prev,
                      fechaHasta: e.target.value,
                    }));
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    !borradorFechas.fechaDesde ||
                    !borradorFechas.fechaHasta
                  ) {
                    toast.error("Por favor, completa ambas fechas.");
                    return;
                  }
                  if (borradorFechas.fechaDesde > borradorFechas.fechaHasta) {
                    toast.error(
                      "La fecha de inicio no puede ser posterior a la fecha de fin.",
                    );
                    return;
                  }
                  toast.success("Fechas aplicadas");
                  setFechaDesde(borradorFechas.fechaDesde);
                  setFechaHasta(borradorFechas.fechaHasta);
                  setPaginaActual(1);
                  onCerrar();
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-marca-morado transition-colors text-sm font-medium"
              >
                Aplicar Fechas
              </button>
            </div>
          </div>

          {/* Aquí irían los inputs dinámicos extra en el futuro */}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={() => {
              handleCerrar();
            }}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
};

export default DrawerFiltros;
