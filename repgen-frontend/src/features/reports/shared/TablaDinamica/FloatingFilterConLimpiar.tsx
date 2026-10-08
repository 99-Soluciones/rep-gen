import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { X } from "lucide-react";
import type { IFloatingFilter, IFloatingFilterParams } from "ag-grid-community";

export interface FloatingFilterConLimpiarParams {
  inputType?: "text" | "number" | "date";
  defaultFilterType?: string;
}

type FloatingFilterProps = IFloatingFilterParams &
  FloatingFilterConLimpiarParams;

const obtenerValorDesdeModelo = (
  parentModel: Record<string, unknown> | null | undefined,
  inputType: FloatingFilterConLimpiarParams["inputType"],
): string => {
  if (!parentModel) {
    return "";
  }

  if (inputType === "date") {
    return typeof parentModel.dateFrom === "string" ? parentModel.dateFrom : "";
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

const FloatingFilterConLimpiar = forwardRef<IFloatingFilter, FloatingFilterProps>(
  (props, ref) => {
    const inputType = props.inputType ?? "text";
    const defaultFilterType =
      props.defaultFilterType ?? (inputType === "text" ? "contains" : "equals");

    const [valor, setValor] = useState("");
    const [filtroActivo, setFiltroActivo] = useState(false);
    const [soloLectura, setSoloLectura] = useState(false);

    const placeholder = useMemo(() => {
      if (props.filterPlaceholder === true) {
        const filterPlaceholder = (
          props.filterParams as { filterPlaceholder?: string }
        ).filterPlaceholder;
        return typeof filterPlaceholder === "string" ? filterPlaceholder : undefined;
      }

      return typeof props.filterPlaceholder === "string"
        ? props.filterPlaceholder
        : undefined;
    }, [props.filterPlaceholder, props.filterParams]);

    const onParentModelChanged = useCallback(
      (parentModel: Record<string, unknown> | null | undefined) => {
        const esRango = parentModel?.type === "inRange";
        const esComplejo =
          parentModel?.operator != null ||
          (Array.isArray(parentModel?.conditions) &&
            parentModel.conditions.length > 1);

        setSoloLectura(Boolean(esRango || esComplejo));
        setValor(obtenerValorDesdeModelo(parentModel, inputType));
        setFiltroActivo(tieneFiltroActivo(parentModel));
      },
      [inputType],
    );

    useImperativeHandle(ref, () => ({
      onParentModelChanged,
    }));

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
      setFiltroActivo(Boolean(nuevoValor));
      notificarCambio(nuevoValor);
    };

    const onLimpiar = () => {
      setValor("");
      setFiltroActivo(false);
      props.parentFilterInstance((parent) => {
        parent.onFloatingFilterChanged(null, null);
      });
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
          />
          {filtroActivo && (
            <button
              type="button"
              onClick={onLimpiar}
              aria-label="Limpiar filtro"
              className="absolute right-1 flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  },
);

FloatingFilterConLimpiar.displayName = "FloatingFilterConLimpiar";

export default FloatingFilterConLimpiar;
