import type { CellClassParams, CellClassRules, ColDef } from "ag-grid-community";

import FloatingFilterConLimpiar from "../TablaDinamica/FloatingFilterConLimpiar";
import FiltroLista from "../TablaDinamica/FiltroLista";
import FloatingFiltroLista from "../TablaDinamica/FloatingFiltroLista";
import {
  esNegativo,
  formatearMoneda,
  formatearFecha,
  formatearNumero,
  formatearPorcentaje,
} from "./formato";

import {
  crearPlaceholderFiltro,
  dateFilterParams,
  floatingFilterParams,
  numberFilterParams,
  textFilterParams,
  type AgGridDataType,
} from "./parametros-filtro";
import { IGUAL_SIN_CENTAVOS } from "./filtro-monto";

type DefaultRowData = Record<string, string | number | null>;

export type LabelResolver = (labelSlot: string) => string | undefined;

export interface ReportColumnMeta {
  field: string;
  dataType: AgGridDataType;
  columnClass?: string;
  defaultHeader?: string;
  labelSlot?: string;
  /** Solo moneda: campo del renglón con su código de moneda (p. ej. "moneda"). */
  currencyField?: string;
  /** Solo texto: "lista" se filtra marcando valores en vez de escribirlos. */
  filtro?: "lista";
  /** Empieza oculta: datos técnicos (ids, RFC) que no van en la primera pantalla. */
  oculta?: boolean;
  /** Ancho mínimo en px, para textos que se leen enteros (Concepto). */
  anchoMinimo?: number;
}

interface ReportSchema<TReportType extends string> {
  columns: Record<string, ReportColumnMeta>;
  reportTypes: Record<TReportType, string[]>;
}

/** Datos propios de la app en el colDef (AG Grid solo admite los suyos fuera de `context`). */
export interface ColumnContext {
  /** Grupo bajo el que aparece la columna en el modal de columnas. */
  claseColumna: string;
  /** Se filtra con FiltroLista (vista.ts convierte los filtros de texto guardados antes). */
  filtroLista?: boolean;
}

interface BaseColumnDef<TRowData> extends Partial<ColDef<TRowData>> {
  headerName: string;
  field: ColDef<TRowData>["field"];
  context: ColumnContext;
}

// Clases de index.css. El rótulo ("Total MXN") cae en la primera columna
// visible, sea del tipo que sea; la tinta roja, solo en columnas de cifras.
const esRotuloTotal = ({ node, value }: { node: CellClassParams["node"] | null; value: unknown }) =>
  node?.rowPinned === "bottom" && typeof value === "string" && value !== "";
const reglasCelda: CellClassRules = { "rotulo-total": esRotuloTotal };

/**
 * El rótulo se escribe tal cual en cualquier columna. Sin esto, una columna de
 * texto con números (Venta ID) la infiere AG Grid como numérica y su
 * formateador por defecto pinta "Invalid Number"; las de cifras lo pasarían
 * por formatearMoneda. Pasa en cuanto una vista deja otra columna primera.
 */
const conRotuloTotal = <TRowData>(columna: ColDef<TRowData>): ColDef<TRowData> => {
  const formatear = columna.valueFormatter;
  return {
    ...columna,
    valueFormatter: (params) => {
      if (esRotuloTotal(params)) return params.value as string;
      if (typeof formatear === "function") return formatear(params);
      return params.value == null ? "" : String(params.value);
    },
  };
};
const reglasCeldaCifra: CellClassRules = {
  ...reglasCelda,
  "cifra-negativa": ({ value }) => esNegativo(value),
};

const obtenerDefinicionColumnaPredeterminada = <TRowData>(): Partial<ColDef<TRowData>> => ({
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: true,
});

const resolverMetaColumna = (
  columnKey: string,
  meta?: ReportColumnMeta,
): { columnId: string; meta: ReportColumnMeta } => {
  if (meta) {
    return { columnId: meta.field, meta };
  }

  return {
    columnId: obtenerCampoAlternativoDesdeEncabezado(columnKey),
    meta: {
      field: obtenerCampoAlternativoDesdeEncabezado(columnKey),
      dataType: "text",
      defaultHeader: columnKey,
    },
  };
};

const resolverNombreEncabezado = (
  encabezadoFallback: string,
  meta: ReportColumnMeta,
  labelResolver?: LabelResolver,
): string => {
  if (meta.labelSlot && labelResolver) {
    const etiqueta = labelResolver(meta.labelSlot);
    if (etiqueta) {
      return etiqueta;
    }
  }

  return meta.defaultHeader ?? encabezadoFallback;
};

export class ColumnBuilder<
  TReportType extends string,
  TRowData = DefaultRowData,
> {
  private readonly schema: ReportSchema<TReportType>;

  constructor(schema: ReportSchema<TReportType>) {
    this.schema = schema;
  }

  construirColumnas(
    reportType: TReportType,
    labelResolver?: LabelResolver,
  ): ColDef<TRowData>[] {
    const columnKeys = this.schema.reportTypes[reportType] ?? [];

    return columnKeys.map((columnKey) => {
      const { columnId, meta } = resolverMetaColumna(
        columnKey,
        this.schema.columns[columnKey],
      );
      const encabezadoFallback = meta.defaultHeader ?? columnKey;
      const headerName = resolverNombreEncabezado(
        encabezadoFallback,
        meta,
        labelResolver,
      );

      return conRotuloTotal(construirColumnaPorTipo<TRowData>(headerName, meta, columnId));
    }) as ColDef<TRowData>[];
  }
}

const obtenerCampoAlternativoDesdeEncabezado = (nombreEncabezado: string): string =>
  nombreEncabezado
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr: string) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());

const construirColumnaPorTipo = <TRowData = DefaultRowData>(
  headerName: string,
  meta?: ReportColumnMeta,
  columnId?: string,
): ColDef<TRowData> => {
  const metadatoResuelto = meta ?? {
    field: obtenerCampoAlternativoDesdeEncabezado(headerName),
    dataType: "text" as AgGridDataType,
  };
  const campoTipado = metadatoResuelto.field as ColDef<TRowData>["field"];
  const colId = columnId ?? metadatoResuelto.field;

  const placeholderFiltro = crearPlaceholderFiltro(headerName);

  const columnaBase: BaseColumnDef<TRowData> = {
    ...obtenerDefinicionColumnaPredeterminada<TRowData>(),
    colId,
    headerName,
    field: campoTipado,
    context: { claseColumna: metadatoResuelto.columnClass || "General" },
    // "— Ninguna —" (resetColumnState) vuelve a este estado inicial.
    ...(metadatoResuelto.oculta ? { hide: true } : {}),
    ...(metadatoResuelto.anchoMinimo ? { minWidth: metadatoResuelto.anchoMinimo } : {}),
    cellClassRules: reglasCelda,
    filterParams: textFilterParams(placeholderFiltro),
    floatingFilterComponent: FloatingFilterConLimpiar,
    floatingFilterComponentParams: floatingFilterParams({
      inputType: "text",
      defaultFilterType: "contains",
    }),
  };

  switch (metadatoResuelto.dataType) {
    case "number":
      return {
        ...columnaBase,
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        cellClassRules: reglasCeldaCifra,
        filterParams: numberFilterParams(placeholderFiltro),
        floatingFilterComponentParams: floatingFilterParams({
          inputType: "number",
          defaultFilterType: IGUAL_SIN_CENTAVOS,
          sinCentavos: true,
        }),
        valueFormatter: ({ value }) => formatearNumero(value),
      };

    case "currency":
      return {
        ...columnaBase,
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        cellClassRules: reglasCeldaCifra,
        filterParams: numberFilterParams(placeholderFiltro),
        floatingFilterComponentParams: floatingFilterParams({
          inputType: "number",
          defaultFilterType: IGUAL_SIN_CENTAVOS,
          sinCentavos: true,
        }),
        // exportar.ts agrega la columna de moneda al CSV si está oculta.
        context: { ...columnaBase.context, campoMoneda: metadatoResuelto.currencyField },
        // La fila de totales no trae el campo de moneda: se formatea en MXN.
        valueFormatter: ({ value, data }) =>
          formatearMoneda(
            value,
            metadatoResuelto.currencyField
              ? (data as Record<string, unknown> | undefined)?.[metadatoResuelto.currencyField]
              : undefined,
          ),
      };

    case "percent":
      return {
        ...columnaBase,
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        cellClassRules: reglasCeldaCifra,
        // Un 16% no tiene centavos: "Igual a" es exacto.
        filterParams: numberFilterParams(placeholderFiltro, { sinCentavos: false }),
        floatingFilterComponentParams: floatingFilterParams({
          inputType: "number",
          defaultFilterType: "equals",
          sinCentavos: false,
        }),
        valueFormatter: ({ value }) => formatearPorcentaje(value),
      };

    case "date":
      return {
        ...columnaBase,
        filter: "agDateColumnFilter",
        filterParams: dateFilterParams(placeholderFiltro),
        // Sin el botón de filtro al lado y con 170px: "dd/mm/aaaa" entra entero.
        suppressFloatingFilterButton: true,
        minWidth: Math.max(170, metadatoResuelto.anchoMinimo ?? 0),
        floatingFilterComponentParams: floatingFilterParams({
          inputType: "date",
          defaultFilterType: "equals",
        }),
        valueFormatter: ({ value }) => formatearFecha(value),
      };

    case "text":
    default:
      if (metadatoResuelto.filtro === "lista") {
        return {
          ...columnaBase,
          context: { ...columnaBase.context, filtroLista: true },
          filter: FiltroLista,
          filterParams: undefined,
          floatingFilterComponent: FloatingFiltroLista,
          floatingFilterComponentParams: undefined,
        };
      }
      return columnaBase;
  }
};
