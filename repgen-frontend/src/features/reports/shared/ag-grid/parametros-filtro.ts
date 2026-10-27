import type {
  FilterAction,
  IFilterOptionDef,
  INumberFilterParams,
  ITextFilterParams,
  IDateFilterParams,
} from "ag-grid-community";
import {
  comparadorFecha,
  filtroContiene,
  filtroDistinto,
  filtroNoContiene,
  filtroVacio,
  filtroFechaEnRango,
  filtroFechaIgual,
  filtroFechaMayorQue,
  filtroFechaMenorQue,
  filtroEntre,
  filtroIgual,
  filtroIgualSinCentavos,
  filtroMayorOIgual,
  filtroMayorQue,
  filtroMenorOIgual,
  filtroMenorQue,
  filtroTextoIgual,
} from "./predicados-filtro";
import { IGUAL_SIN_CENTAVOS } from "./filtro-monto";

export type AgGridDataType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "percent";

export const crearPlaceholderFiltro = (nombreColumna: string): string =>
  `${nombreColumna}…`;

const botonesFiltroPopup: FilterAction[] = ["reset"];

type FloatingFilterInputType = "text" | "number" | "date";

/** Configura el floating filter visible con placeholder y tipo de input. */
export const floatingFilterParams = (config: {
  inputType: FloatingFilterInputType;
  defaultFilterType: string;
  /** Montos: un número entero en el filtro ignora los centavos (ag-grid/filtro-monto.ts). */
  sinCentavos?: boolean;
}) => ({
  filterPlaceholder: true as const,
  ...config,
});

export const textFilterParams = (
  filterPlaceholder: string,
): ITextFilterParams => {
  return {
    filterPlaceholder: filterPlaceholder,
    filterOptions: [
      {
        displayKey: "contains",
        displayName: "Contiene",
        predicate: filtroContiene,
      },
      {
        displayKey: "notContains",
        displayName: "No contiene",
        predicate: filtroNoContiene,
      },
      {
        displayKey: "equals",
        displayName: "Igual a",
        predicate: filtroTextoIgual,
      },
      {
        displayKey: "notEqual",
        displayName: "Distinto de",
        predicate: filtroDistinto,
      },
      {
        displayKey: "blank",
        displayName: "Vacío",
        predicate: filtroVacio,
        numberOfInputs: 0,
      },
    ] as IFilterOptionDef[],
    defaultOption: "contains",
    maxNumConditions: 1,
    trimInput: true,
    debounceMs: 450,
    buttons: botonesFiltroPopup,
  };
};

/**
 * Filtro de números. Con `sinCentavos` (montos y cantidades) "Igual a" ignora
 * los centavos de un valor entero y el exacto queda aparte, "Igual a (exacto)":
 * así las vistas guardadas con el "Igual a" de antes conservan su significado.
 * Los porcentajes usan el exacto como "Igual a". Hasta dos condiciones (Y/O).
 */
export const numberFilterParams = (
  filterPlaceholder: string,
  { sinCentavos = true }: { sinCentavos?: boolean } = {},
): INumberFilterParams => {
  return {
    filterPlaceholder: filterPlaceholder,
    filterOptions: [
      ...(sinCentavos
        ? [
            {
              displayKey: IGUAL_SIN_CENTAVOS,
              displayName: "Igual a",
              predicate: filtroIgualSinCentavos,
            },
          ]
        : []),
      {
        displayKey: "equals",
        displayName: sinCentavos ? "Igual a (exacto)" : "Igual a",
        predicate: filtroIgual,
      },
      {
        displayKey: "greaterThan",
        displayName: "Mayor que",
        predicate: filtroMayorQue,
      },
      {
        displayKey: "greaterThanOrEqual",
        displayName: "Mayor o igual que",
        predicate: filtroMayorOIgual,
      },
      {
        displayKey: "lessThan",
        displayName: "Menor que",
        predicate: filtroMenorQue,
      },
      {
        displayKey: "lessThanOrEqual",
        displayName: "Menor o igual que",
        predicate: filtroMenorOIgual,
      },
      {
        displayKey: "inRange",
        displayName: "Entre",
        predicate: filtroEntre,
        numberOfInputs: 2,
      },
      {
        displayKey: "blank",
        displayName: "Vacío",
        predicate: filtroVacio,
        numberOfInputs: 0,
      },
    ] as IFilterOptionDef[],
    maxNumConditions: 2,
    defaultOption: sinCentavos ? IGUAL_SIN_CENTAVOS : "equals",
    debounceMs: 450,
    buttons: botonesFiltroPopup,
  };
};

export const dateFilterParams = (filterPlaceholder: string): IDateFilterParams => {
  return {
    filterPlaceholder: filterPlaceholder,
    comparator: comparadorFecha,
    filterOptions: [
      {
        displayKey: "equals",
        displayName: "Igual a",
        predicate: filtroFechaIgual,
      },
      {
        displayKey: "greaterThan",
        displayName: "Después de",
        predicate: filtroFechaMayorQue,
      },
      {
        displayKey: "lessThan",
        displayName: "Antes de",
        predicate: filtroFechaMenorQue,
      },
      {
        displayKey: "inRange",
        displayName: "Entre",
        predicate: filtroFechaEnRango,
        numberOfInputs: 2,
      },
      {
        displayKey: "blank",
        displayName: "Vacío",
        predicate: filtroVacio,
        numberOfInputs: 0,
      },
    ] as IFilterOptionDef[],
    defaultOption: "equals",
    maxNumConditions: 1,
    debounceMs: 450,
    buttons: botonesFiltroPopup,
  };
};
