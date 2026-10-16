import type { GridApi } from "ag-grid-community";
import { formatearFecha } from "../../../../shared/utils/fechas";
import { IGUAL_SIN_CENTAVOS } from "../ag-grid/filtro-monto";
import { etiquetaValor, type ModeloLista } from "../ag-grid/filtro-lista";

/** Un filtro de columna en palabras, para que se vea qué recorta la tabla. */
export interface FiltroDescrito {
  colId: string;
  columna: string;
  /** "contiene «BBVA»", "mayor que 5,000", "entre 01/09/2026 y 15/09/2026"... */
  condicion: string;
  /** La columna está oculta: el filtro aplica pero no se ve en la tabla. */
  oculta: boolean;
}

interface CondicionModelo {
  filterType?: string;
  modo?: "incluir" | "excluir" | "texto";
  valores?: string[];
  condicion?: CondicionModelo;
  type?: string | null;
  filter?: unknown;
  filterTo?: unknown;
  dateFrom?: string | null;
  dateTo?: string | null;
  operator?: "AND" | "OR";
  conditions?: CondicionModelo[];
}

// Mismos nombres que el menú de filtros (ag-grid/locale-es.ts), en minúscula
// porque van a media frase.
const OPERADORES: Record<string, string> = {
  contains: "contiene",
  notContains: "no contiene",
  equals: "igual a",
  notEqual: "distinto de",
  startsWith: "empieza con",
  endsWith: "termina con",
  lessThan: "menor que",
  lessThanOrEqual: "menor o igual que",
  greaterThan: "mayor que",
  greaterThanOrEqual: "mayor o igual que",
  inRange: "entre",
  blank: "vacío",
  notBlank: "no vacío",
};

const OPERADORES_FECHA: Record<string, string> = {
  greaterThan: "después de",
  lessThan: "antes de",
};

const numero = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });

const valor = (condicion: CondicionModelo, cual: "desde" | "hasta"): string => {
  if (condicion.filterType === "date") {
    const fecha = cual === "desde" ? condicion.dateFrom : condicion.dateTo;
    return fecha ? formatearFecha(fecha) : "";
  }
  const crudo = cual === "desde" ? condicion.filter : condicion.filterTo;
  if (condicion.filterType === "number" && typeof crudo === "number") return numero.format(crudo);
  return `«${String(crudo ?? "")}»`;
};

/** Una lista de valores en palabras: "es BBVA o Santander", "todo menos Cancelada". */
const describirLista = (condicion: CondicionModelo): string => {
  if (condicion.modo === "texto" && condicion.condicion) return describirCondicion(condicion.condicion);
  const valores = (condicion.valores ?? []).map(etiquetaValor);
  if (condicion.modo === "excluir") return `todo menos ${valores.join(", ")}`;
  return valores.length === 0 ? "ningún valor" : `es ${valores.join(" o ")}`;
};

/** Lo que dice el botón bajo el encabezado de una columna de lista, sin abrirla. */
export const resumenLista = (modelo: ModeloLista | null | undefined): string => {
  if (!modelo) return "Todos";
  if (modelo.modo === "texto") return describirCondicion(modelo.condicion);
  const valores = modelo.valores.map(etiquetaValor);
  if (modelo.modo === "incluir") {
    if (valores.length === 0) return "Ninguno";
    return valores.length <= 2 ? valores.join(", ") : `${valores.length} valores`;
  }
  return valores.length === 1 ? `Todo menos ${valores[0]}` : `Todo menos ${valores.length}`;
};

export const describirCondicion = (condicion: CondicionModelo): string => {
  if (condicion.filterType === "lista") return describirLista(condicion);
  if (condicion.conditions?.length) {
    const union = condicion.operator === "OR" ? " o " : " y ";
    return condicion.conditions.map(describirCondicion).join(union);
  }
  const tipo = condicion.type ?? "";
  // En fechas, "mayor/menor que" se dice como en el menú: después de / antes de.
  const operador =
    (condicion.filterType === "date" && OPERADORES_FECHA[tipo]) || OPERADORES[tipo] || tipo;
  if (tipo === "blank" || tipo === "notBlank") return operador;
  if (tipo === "inRange") return `entre ${valor(condicion, "desde")} y ${valor(condicion, "hasta")}`;
  if (tipo === IGUAL_SIN_CENTAVOS) {
    const entero = Number.isInteger(Number(condicion.filter));
    return `igual a ${valor(condicion, "desde")}${entero ? " (sin centavos)" : ""}`;
  }
  return `${operador} ${valor(condicion, "desde")}`;
};

/** Los filtros activos, incluidos los de columnas ocultas. */
export const describirFiltros = (api: GridApi): FiltroDescrito[] => {
  const modelo = api.getFilterModel() as Record<string, CondicionModelo>;
  return Object.entries(modelo).map(([colId, condicion]) => {
    const columna = api.getColumn(colId);
    return {
      colId,
      columna: columna ? api.getDisplayNameForColumn(columna, "header") : colId,
      condicion: describirCondicion(condicion),
      oculta: columna ? !columna.isVisible() : false,
    };
  });
};
