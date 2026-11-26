import type { CustomDateProps } from "ag-grid-react";
import CampoFecha from "../CampoFecha";

const aIso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

/**
 * Campo de fecha del filtro de columna (menú ▾): dd/mm/aaaa como en la tabla,
 * en lugar del input nativo de AG Grid, que sigue al idioma del navegador.
 */
const FechaFiltroGrid = ({ date, onDateChange }: CustomDateProps) => (
  <CampoFecha
    value={date ? aIso(date) : ""}
    onChange={(iso) => onDateChange(iso ? new Date(`${iso}T00:00:00`) : null)}
    aria-label="Fecha del filtro"
    className="ag-input-field-input ag-text-field-input w-full"
  />
);

export default FechaFiltroGrid;
