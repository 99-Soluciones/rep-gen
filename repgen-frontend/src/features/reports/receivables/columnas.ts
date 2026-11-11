import type { ColDef, ColGroupDef } from "ag-grid-community";
import type { ReportReceivablesRecord } from "@repgen/shared-types";

import schema from "./cxc.schema.json";
import {
  ColumnBuilder,
  type ColumnContext,
  type LabelResolver,
} from "../shared/ag-grid/construir-columnas";
import type { AgGridDataType } from "../shared/ag-grid/parametros-filtro";

type CxcReportType = "default";

interface CxcColumnMeta {
  field: string;
  dataType: AgGridDataType;
  filtro?: "lista";
  oculta?: boolean;
  anchoMinimo?: number;
  /** Sección: agrupa en el modal Columnas y en la franja sobre los encabezados. */
  columnClass: string;
  defaultHeader?: string;
  /** Encabezado del tenant (GET /tenant/column-labels), p. ej. "Canal". */
  labelSlot?: string;
}

interface CxcSchema {
  columns: Record<string, CxcColumnMeta>;
  reportTypes: Record<CxcReportType, string[]>;
}

const constructorColumnas = new ColumnBuilder<CxcReportType, ReportReceivablesRecord>(
  schema as CxcSchema,
);

/** Las 42 columnas del contrato; las clasificaciones toman el nombre del tenant. */
export const construirColumnasCxc = (
  labelResolver?: LabelResolver,
): ColDef<ReportReceivablesRecord>[] =>
  constructorColumnas.construirColumnas("default", labelResolver).map((columna) =>
    columna.field === "cliente" ? { ...columna, initialPinned: "left" } : columna,
  );

/**
 * Las columnas agrupadas por sección consecutiva (Cliente, Factura, Banco…)
 * para la franja sobre los encabezados. `marryChildren`: una columna no se
 * puede arrastrar fuera de su sección.
 */
export const agruparPorSeccion = <T>(columnas: ColDef<T>[]): ColGroupDef<T>[] =>
  columnas.reduce<ColGroupDef<T>[]>((grupos, columna) => {
    const seccion = (columna.context as ColumnContext).claseColumna;
    const ultimo = grupos.at(-1);
    if (ultimo?.headerName === seccion) ultimo.children.push(columna);
    else grupos.push({ headerName: seccion, groupId: seccion, marryChildren: true, children: [columna] });
    return grupos;
  }, []);
