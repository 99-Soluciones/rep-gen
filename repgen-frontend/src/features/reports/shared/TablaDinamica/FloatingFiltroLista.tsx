import { ChevronDown, X } from "lucide-react";
import type { CustomFloatingFilterProps } from "ag-grid-react";
import type { IFilter } from "ag-grid-community";
import type { ModeloLista } from "../ag-grid/filtro-lista";
import { resumenLista } from "./describirFiltros";

/**
 * Bajo el encabezado de una columna de lista: un botón con lo elegido que
 * abre la lista (la misma que el menú de la columna) y una "X" para quitarlo.
 */
const FloatingFiltroLista = (props: CustomFloatingFilterProps<IFilter, unknown, unknown, ModeloLista>) => {
  const nombre = props.column.getColDef().headerName ?? props.column.getColId();
  const texto = resumenLista(props.model);
  const activo = props.model != null;

  return (
    <div className="ag-floating-filter-input w-full">
      <div className="relative flex w-full items-center">
        <button
          type="button"
          onClick={() => props.showParentFilter()}
          aria-haspopup="dialog"
          aria-label={`Filtrar ${nombre}: ${texto}`}
          // Caja como los demás filtros flotantes: se lee como un control, no como texto.
          // pr-7 deja lugar a la X solo cuando la hay; sin ella, el chevron va al borde.
          // Activo: borde azul y velo, como los demás filtros flotantes con filtro.
          className={`flex h-[30px] w-full items-center justify-between gap-1 rounded border pl-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            activo
              ? "border-blue-600 bg-blue-50 pr-7 font-medium text-gray-900"
              : "border-gray-300 bg-white pr-2 font-normal text-gray-600 hover:border-blue-300"
          }`}
        >
          <span className="min-w-0 truncate">{texto}</span>
          {!activo && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />}
        </button>
        {activo && (
          <button
            type="button"
            onClick={() => props.onModelChange(null)}
            aria-label={`Limpiar filtro de ${nombre}`}
            className="absolute right-1 flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 before:absolute before:-inset-2 before:content-['']"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingFiltroLista;
