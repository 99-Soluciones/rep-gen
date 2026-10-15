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
  filtroVacio,
  filtroFechaEnRango,
  filtroFechaIgual,
  filtroFechaMayorQue,
  filtroFechaMenorQue,
  filtroIgual,
  filtroTextoIgual,
  filtroMayorQue,
  filtroMenorQue,
} from "./predicados-filtro";

export type AgGridDataType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "percent";

export const crearPlaceholderFiltro = (nombreColumna: string): string =>
  `${nombreColumna}...`;

const botonesFiltroPopup: FilterAction[] = ["reset"];

type FloatingFilterInputType = "text" | "number" | "date";

/** Configura el floating filter visible con placeholder y tipo de input. */
export const floatingFilterParams = (config: {
  inputType: FloatingFilterInputType;
  defaultFilterType: string;
}) => ({
  filterPlaceholder: true as const,
  inputType: config.inputType,
  defaultFilterType: config.defaultFilterType,
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
        displayKey: "equals",
        displayName: "Igual a",
        predicate: filtroTextoIgual,
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

export const numberFilterParams = (
  filterPlaceholder: string,
): INumberFilterParams => {
  return {
    filterPlaceholder: filterPlaceholder,
    filterOptions: [
      {
        displayKey: "equals",
        displayName: "Igual a",
        predicate: filtroIgual,
      },
      {
        displayKey: "greaterThan",
        displayName: "Mayor que",
        predicate: filtroMayorQue,
      },
      {
        displayKey: "lessThan",
        displayName: "Menor que",
        predicate: filtroMenorQue,
      },
      {
        displayKey: "blank",
        displayName: "Vacío",
        predicate: filtroVacio,
        numberOfInputs: 0,
      },
    ] as IFilterOptionDef[],
    maxNumConditions: 1,
    defaultOption: "equals",
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
        displayName: "Mayor que",
        predicate: filtroFechaMayorQue,
      },
      {
        displayKey: "lessThan",
        displayName: "Menor que",
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
