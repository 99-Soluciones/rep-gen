import type { ColDef } from "ag-grid-community";
import type { ReportReceivablesRecord } from "@repgen/shared-types";

import schema from "./cxc.schema.json";
import {
  ColumnBuilder,
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
