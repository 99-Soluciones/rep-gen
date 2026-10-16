import type { CustomCellRendererProps } from "ag-grid-react";
import { CLAVE_NOTA_TOTALES } from "./totales";

/**
 * Rótulo de la fila de totales: la etiqueta como Label y, si el reporte la da,
 * una aclaración debajo en caja normal ("No es la facturación neta"). Ambas líneas son texto de la celda: también las lee el lector de
 * pantalla.
 */
const RotuloTotales = ({ value, data }: CustomCellRendererProps) => {
  const nota = (data as Record<string, unknown> | undefined)?.[CLAVE_NOTA_TOTALES];
  return (
    <span className="flex flex-col leading-tight">
      <span className="truncate">{String(value)}</span>
      {typeof nota === "string" && nota && (
        <span className="whitespace-normal text-xs font-normal normal-case tracking-normal text-gray-600">{nota}</span>
      )}
    </span>
  );
};

export default RotuloTotales;
