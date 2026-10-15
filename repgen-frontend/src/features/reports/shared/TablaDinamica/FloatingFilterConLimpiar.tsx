import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { CustomFloatingFilterProps } from "ag-grid-react";
import type { IFilter, IFloatingFilterParent } from "ag-grid-community";
import { interpretarMonto, montoATexto } from "../ag-grid/filtro-monto";

export interface FloatingFilterConLimpiarParams {
  inputType?: "text" | "number" | "date";
  defaultFilterType?: string;
  /** Montos: un número entero ignora los centavos (ag-grid/filtro-monto.ts). */
  sinCentavos?: boolean;
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

// Igual que el debounce de los filtros de texto (parametros-filtro.ts): no se
// filtra ni se marca un error a media tecla (">" antes de ">5000").
const ESPERA_MONTO_MS = 450;

const obtenerValorDesdeModelo = (
  parentModel: Record<string, unknown> | null | undefined,
  inputType: FloatingFilterConLimpiarParams["inputType"],
  sinCentavos: boolean,
): string => {
  if (!parentModel) {
    return "";
  }

  if (inputType === "date") {
    // El modelo de fecha de AG Grid es "YYYY-MM-DD HH:mm:ss"; el input solo acepta la fecha.
    return typeof parentModel.dateFrom === "string" ? parentModel.dateFrom.slice(0, 10) : "";
  }

  if (inputType === "number") return montoATexto(parentModel, sinCentavos);

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
    return Boolean(parentModel.dateFrom || parentModel.dateTo || parentModel.filter != null);
  }

  if (parentModel.filter != null && parentModel.filter !== "") {
    return true;
  }

  return Boolean(parentModel.dateFrom);
};

/**
 * Lo que no cabe en un solo input: un filtro con varias condiciones, o un
 * rango de fechas. Un rango de montos sí cabe ("1000-5000").
 */
const esModeloComplejo = (
  parentModel: ModeloFiltro | null | undefined,
  inputType: FloatingFilterConLimpiarParams["inputType"],
): boolean =>
  (parentModel?.type === "inRange" && inputType !== "number") ||
  parentModel?.operator != null ||
  (Array.isArray(parentModel?.conditions) && parentModel.conditions.length > 1);

const AYUDA_MONTO = "Monto, >5000, <0 o 1000-5000";
const AYUDA_MONTO_INVALIDO = "No es un monto. Escribe un monto, >5000 o 1000-5000.";
const AYUDA_SOLO_LECTURA = "Filtro con varias condiciones: edítalo desde el menú de la columna.";

/**
 * Pista visible bajo el input mientras tiene el foco. El encabezado de AG Grid
 * recorta lo que se sale de la celda, así que va en un portal con posición
 * fija y sigue al input si la tabla o la página hacen scroll. Para lectores de
 * pantalla el mismo texto ya está en aria-describedby: esta es solo visual.
 */
const posicionBajo = (el: HTMLElement | null) => {
  const rect = el?.getBoundingClientRect();
  if (!rect) return null;
  // Sin salirse por la derecha de la ventana (columnas al final de la tabla).
  return { top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 248)) };
};

const PistaFiltro = ({
  ancla,
  inicial,
  texto,
  error,
}: {
  ancla: RefObject<HTMLInputElement | null>;
  /** Medida al recibir el foco (en el evento, no durante el render). */
  inicial: { top: number; left: number } | null;
  texto: string;
  error: boolean;
}) => {
  const [posicion, setPosicion] = useState(inicial);

  useEffect(() => {
    const seguir = () => setPosicion(posicionBajo(ancla.current));
    window.addEventListener("scroll", seguir, true);
    window.addEventListener("resize", seguir);
    return () => {
      window.removeEventListener("scroll", seguir, true);
      window.removeEventListener("resize", seguir);
    };
  });

  if (!posicion) return null;
  return createPortal(
    <div
      aria-hidden="true"
      style={{ position: "fixed", top: posicion.top, left: posicion.left }}
      className={`pointer-events-none z-50 max-w-60 rounded-md border bg-white px-2 py-1 text-xs shadow-lg ${
        error ? "border-red-200 text-red-600" : "border-gray-200 text-gray-600"
      }`}
    >
      {texto}
    </div>,
    document.body,
  );
};

/** Lo escrito, en la forma en que el modelo lo devolvería ("$5,000" → "5000"). */
const normalizar = (
  texto: string,
  inputType: FloatingFilterConLimpiarParams["inputType"],
  sinCentavos: boolean,
): string => {
  if (inputType !== "number") return texto.trim();
  const condicion = interpretarMonto(texto, sinCentavos);
  return condicion && condicion !== "invalido" ? montoATexto(condicion, sinCentavos) : texto;
};

/**
 * Filtro flotante con botón para limpiar. AG Grid (componentes reactivos) le
 * pasa el modelo del filtro padre en `model`: el input se sincroniza con él,
 * así que también refleja cambios hechos por API (p. ej. setFilterModel(null)).
 * Texto y fechas pasan por el filtro padre para respetar su debounce; los
 * montos se interpretan aquí (">5000", "1000-5000"…) y fijan el modelo entero.
 */
const FloatingFilterConLimpiar = (props: FloatingFilterProps) => {
  const inputType = props.inputType ?? "text";
  const sinCentavos = props.sinCentavos ?? false;
  const defaultFilterType =
    props.defaultFilterType ?? (inputType === "text" ? "contains" : "equals");

  const [valor, setValor] = useState(() =>
    obtenerValorDesdeModelo(props.model, inputType, sinCentavos),
  );
  const [modeloAnterior, setModeloAnterior] = useState(props.model);
  // Monto que no es una condición: se marca (tras la espera) y no filtra.
  const [invalido, setInvalido] = useState(false);
  const [enfocado, setEnfocado] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const esperaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (esperaRef.current) clearTimeout(esperaRef.current);
  }, []);

  // Ajuste de estado durante el render cuando cambia el modelo. Si el modelo
  // corresponde a lo que ya está escrito (p. ej. "abc " recortado a "abc", o
  // "$5,000" leído como 5000), no se pisa el input mientras el usuario teclea.
  if (props.model !== modeloAnterior) {
    setModeloAnterior(props.model);
    const valorModelo = obtenerValorDesdeModelo(props.model, inputType, sinCentavos);
    // Un monto inválido quita el filtro: el texto se queda para corregirlo.
    const quitadoPorInvalido = invalido && valorModelo === "";
    if (normalizar(valor, inputType, sinCentavos) !== valorModelo && !quitadoPorInvalido) {
      setValor(valorModelo);
      setInvalido(false);
    }
  }

  const soloLectura = esModeloComplejo(props.model, inputType);
  const nombreColumna = props.column.getColDef().headerName ?? props.column.getColId();
  const filtroActivo = valor !== "" || tieneFiltroActivo(props.model);
  const idAyuda = `ayuda-filtro-${props.column.getColId()}`;

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

  const aplicarMonto = (texto: string) => {
    const condicion = interpretarMonto(texto, sinCentavos);
    setInvalido(condicion === "invalido");
    // Lo que no se entiende no filtra: dejar el filtro anterior sería mostrar
    // filas que no corresponden a lo que dice el input.
    const modelo =
      condicion && condicion !== "invalido" ? { filterType: "number", ...condicion } : null;
    props.parentFilterInstance((parent) => {
      void Promise.resolve(parent.setModel(modelo)).then(() => props.api.onFilterChanged());
    });
  };

  const notificarCambio = (nuevoValor: string) => {
    if (inputType === "number") {
      if (esperaRef.current) clearTimeout(esperaRef.current);
      if (!nuevoValor) {
        aplicarMonto("");
        return;
      }
      esperaRef.current = setTimeout(() => aplicarMonto(nuevoValor), ESPERA_MONTO_MS);
      return;
    }

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
    setInvalido(false);
    notificarCambio("");
  };

  return (
    <div className="ag-floating-filter-input w-full">
      <div className="relative flex w-full items-center">
        <input
          ref={inputRef}
          onFocus={(evento) => setEnfocado(posicionBajo(evento.currentTarget))}
          onBlur={() => setEnfocado(null)}
          className={`ag-input-field-input ag-text-field-input w-full pr-7 ${invalido ? "border-red-600!" : ""}`}
          // Montos como texto: ">", "<" y el guion del rango no caben en type="number".
          type={inputType === "number" ? "text" : inputType}
          inputMode={inputType === "number" ? "decimal" : undefined}
          value={valor}
          onChange={onChange}
          readOnly={soloLectura}
          placeholder={placeholder}
          aria-label={`Filtrar ${nombreColumna}`}
          aria-invalid={invalido || undefined}
          aria-describedby={
            [inputType === "number" ? idAyuda : "", soloLectura ? `${idAyuda}-solo-lectura` : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {enfocado && (soloLectura || inputType === "number") && (
          <PistaFiltro
            ancla={inputRef}
            inicial={enfocado}
            texto={soloLectura ? AYUDA_SOLO_LECTURA : invalido ? AYUDA_MONTO_INVALIDO : AYUDA_MONTO}
            error={invalido && !soloLectura}
          />
        )}
        {inputType === "number" && (
          <span id={idAyuda} className="sr-only">
            {invalido ? AYUDA_MONTO_INVALIDO : `${AYUDA_MONTO}.`}
          </span>
        )}
        {soloLectura && (
          <span id={`${idAyuda}-solo-lectura`} className="sr-only">
            {AYUDA_SOLO_LECTURA}
          </span>
        )}
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
