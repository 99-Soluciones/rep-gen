import { useState } from "react";
import toast from "react-hot-toast";

import { obtenerFechaHoyFormateada } from "../../../utils/dateFormatted";

interface FiltroFechasProps {
  fechaDesde: string;
  setFechaDesde: (val: string) => void;
  fechaHasta: string;
  setFechaHasta: (val: string) => void;
}

/**
 * Rango de fechas con borrador local: los cambios solo se aplican (y disparan
 * una nueva consulta) al presionar "Aplicar". Se renderiza a la izquierda de
 * la barra de controles de la tabla, vía el slot `accionesToolbarInicio` de
 * TablaDinamica.
 */
const FiltroFechas = ({
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
}: FiltroFechasProps) => {
  const [borradorFechas, setBorradorFechas] = useState({
    fechaDesde,
    fechaHasta,
  });

  const aplicarFechas = () => {
    if (!borradorFechas.fechaDesde || !borradorFechas.fechaHasta) {
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
  };

  const fechasSinCambios =
    borradorFechas.fechaDesde === fechaDesde &&
    borradorFechas.fechaHasta === fechaHasta;

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <label className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500">Desde:</span>
        <input
          type="date"
          aria-label="Fecha desde"
          max={borradorFechas.fechaHasta || obtenerFechaHoyFormateada()}
          value={borradorFechas.fechaDesde}
          onChange={(e) =>
            setBorradorFechas((prev) => ({
              ...prev,
              fechaDesde: e.target.value,
            }))
          }
          className="px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500">Hasta:</span>
        <input
          type="date"
          aria-label="Fecha hasta"
          min={borradorFechas.fechaDesde}
          max={obtenerFechaHoyFormateada()}
          value={borradorFechas.fechaHasta}
          onChange={(e) =>
            setBorradorFechas((prev) => ({
              ...prev,
              fechaHasta: e.target.value,
            }))
          }
          className="px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </label>
      <button
        type="button"
        onClick={aplicarFechas}
        disabled={fechasSinCambios}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-marca-morado transition-colors text-sm font-medium disabled:opacity-50"
      >
        Aplicar
      </button>
    </div>
  );
};

export default FiltroFechas;
