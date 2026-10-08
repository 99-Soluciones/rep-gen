import type { ColDef } from "ag-grid-community";

import FloatingFilterConLimpiar from "../TablaDinamica/FloatingFilterConLimpiar";
import {
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

type DefaultRowData = Record<string, string | number | null>;

export type LabelResolver = (labelSlot: string) => string | undefined;

export interface ReportColumnMeta {
  field: string;
  dataType: AgGridDataType;
  columnClass?: string;
  defaultHeader?: string;
  labelSlot?: string;
}

interface ReportSchema<TReportType extends string> {
  columns: Record<string, ReportColumnMeta>;
  reportTypes: Record<TReportType, string[]>;
}

/** Datos propios de la app en el colDef (AG Grid solo admite los suyos fuera de `context`). */
export interface ColumnContext {
  /** Grupo bajo el que aparece la columna en el modal de columnas. */
  claseColumna: string;
}

interface BaseColumnDef<TRowData> extends Partial<ColDef<TRowData>> {
  headerName: string;
  field: ColDef<TRowData>["field"];
  context: ColumnContext;
}

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

      return construirColumnaPorTipo<TRowData>(headerName, meta, columnId);
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
        filterParams: numberFilterParams(placeholderFiltro),
        floatingFilterComponentParams: floatingFilterParams({
          inputType: "number",
          defaultFilterType: "equals",
        }),
        valueFormatter: ({ value }) => formatearNumero(value),
      };

    case "currency":
      return {
        ...columnaBase,
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        filterParams: numberFilterParams(placeholderFiltro),
        floatingFilterComponentParams: floatingFilterParams({
          inputType: "number",
          defaultFilterType: "equals",
        }),
        valueFormatter: ({ value }) => formatearMoneda(value),
      };

    case "percent":
      return {
        ...columnaBase,
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        filterParams: numberFilterParams(placeholderFiltro),
        floatingFilterComponentParams: floatingFilterParams({
          inputType: "number",
          defaultFilterType: "equals",
        }),
        valueFormatter: ({ value }) => formatearPorcentaje(value),
      };

    case "date":
      return {
        ...columnaBase,
        filter: "agDateColumnFilter",
        filterParams: dateFilterParams(placeholderFiltro),
        floatingFilterComponentParams: floatingFilterParams({
          inputType: "date",
          defaultFilterType: "equals",
        }),
        valueFormatter: ({ value }) => formatearFecha(value),
      };

    case "text":
    default:
      return columnaBase;
  }
};
