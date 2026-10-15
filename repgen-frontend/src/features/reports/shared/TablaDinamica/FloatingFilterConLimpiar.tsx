import { useState } from "react";
import { X } from "lucide-react";
import type { CustomFloatingFilterProps } from "ag-grid-react";
import type { IFilter, IFloatingFilterParent } from "ag-grid-community";

export interface FloatingFilterConLimpiarParams {
  inputType?: "text" | "number" | "date";
  defaultFilterType?: string;
}

type ModeloFiltro = Record<string, unknown>;

// El filtro padre es el filtro de texto/número/fecha provisto por AG Grid.
type FloatingFilterProps = CustomFloatingFilterProps<
  IFloatingFilterParent & IFilter,
  unknown,
  unknown,
  ModeloFiltro
> &
  FloatingFilterConLimpiarParams;

const obtenerValorDesdeModelo = (
  parentModel: Record<string, unknown> | null | undefined,
  inputType: FloatingFilterConLimpiarParams["inputType"],
): string => {
  if (!parentModel) {
    return "";
  }

  if (inputType === "date") {
    // El modelo de fecha de AG Grid es "YYYY-MM-DD HH:mm:ss"; el input solo acepta la fecha.
    return typeof parentModel.dateFrom === "string" ? parentModel.dateFrom.slice(0, 10) : "";
  }

  return parentModel.filter != null ? String(parentModel.filter) : "";
};

const tieneFiltroActivo = (
  parentModel: Record<string, unknown> | null | undefined,
): boolean => {
  if (!parentModel) {
    return false;
  }

  if (parentModel.type === "blank") {
    return true;
  }

  if (parentModel.type === "inRange") {
    return Boolean(parentModel.dateFrom || parentModel.dateTo);
  }

  if (parentModel.filter != null && parentModel.filter !== "") {
    return true;
  }

  return Boolean(parentModel.dateFrom);
};

/** Un rango o un filtro con varias condiciones no cabe en un solo input. */
const esModeloComplejo = (parentModel: ModeloFiltro | null | undefined): boolean =>
  parentModel?.type === "inRange" ||
  parentModel?.operator != null ||
  (Array.isArray(parentModel?.conditions) && parentModel.conditions.length > 1);

/**
 * Filtro flotante con botón para limpiar. AG Grid (componentes reactivos) le
 * pasa el modelo del filtro padre en `model`: el input se sincroniza con él,
 * así que también refleja cambios hechos por API (p. ej. setFilterModel(null)).
 * Lo que escribe el usuario pasa por el filtro padre para respetar su debounce.
 */
const FloatingFilterConLimpiar = (props: FloatingFilterProps) => {
  const inputType = props.inputType ?? "text";
  const defaultFilterType =
    props.defaultFilterType ?? (inputType === "text" ? "contains" : "equals");

  const [valor, setValor] = useState(() => obtenerValorDesdeModelo(props.model, inputType));
  const [modeloAnterior, setModeloAnterior] = useState(props.model);

  // Ajuste de estado durante el render cuando cambia el modelo. Si el modelo
  // corresponde a lo que ya está escrito (p. ej. "abc " recortado a "abc"),
  // no se pisa el input mientras el usuario teclea.
  if (props.model !== modeloAnterior) {
    setModeloAnterior(props.model);
    const valorModelo = obtenerValorDesdeModelo(props.model, inputType);
    const escrito =
      inputType === "number" && valor !== "" ? String(Number(valor)) : valor.trim();
    if (escrito !== valorModelo) setValor(valorModelo);
  }

  const soloLectura = esModeloComplejo(props.model);
  const nombreColumna = props.column.getColDef().headerName ?? props.column.getColId();
  const filtroActivo = valor !== "" || tieneFiltroActivo(props.model);

  const filterPlaceholder = (props.filterParams as { filterPlaceholder?: unknown })
    .filterPlaceholder;
  const placeholder =
    props.filterPlaceholder === true
      ? typeof filterPlaceholder === "string"
        ? filterPlaceholder
        : undefined
      : typeof props.filterPlaceholder === "string"
        ? props.filterPlaceholder
        : undefined;

  const notificarCambio = (nuevoValor: string) => {
    props.parentFilterInstance((parent) => {
      if (!nuevoValor) {
        parent.onFloatingFilterChanged(null, null);
        return;
      }

      if (inputType === "date") {
        const fecha = new Date(`${nuevoValor}T00:00:00`);
        parent.onFloatingFilterChanged(defaultFilterType, fecha);
        return;
      }

      parent.onFloatingFilterChanged(defaultFilterType, nuevoValor);
    });
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = event.target.value;
    setValor(nuevoValor);
    notificarCambio(nuevoValor);
  };

  const onLimpiar = () => {
    setValor("");
    notificarCambio("");
  };

  return (
    <div className="ag-floating-filter-input w-full">
      <div className="relative flex w-full items-center">
        <input
          className="ag-input-field-input ag-text-field-input w-full pr-7"
          type={inputType}
          value={valor}
          onChange={onChange}
          readOnly={soloLectura}
          placeholder={placeholder}
          aria-label={`Filtrar ${nombreColumna}`}
          title={soloLectura ? "Filtro con varias condiciones: edítalo desde el filtro de la columna" : undefined}
        />
        {filtroActivo && (
          <button
            type="button"
            onClick={onLimpiar}
            aria-label={`Limpiar filtro de ${nombreColumna}`}
            // Se ve de 20px pero responde en 36px: en pantallas táctiles no hace falta puntería.
            className="absolute right-1 flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 before:absolute before:-inset-2 before:content-['']"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingFilterConLimpiar;
