import type { ColDef } from "ag-grid-community";
import type { ReportPayablesRecord } from "@repgen/shared-types";

import schema from "./cxp.schema.json";
import { ColumnBuilder } from "../shared/ag-grid/construir-columnas";
import type { AgGridDataType } from "../shared/ag-grid/parametros-filtro";

type CxpReportType = "default";

interface CxpColumnMeta {
  field: string;
  dataType: AgGridDataType;
  filtro?: "lista";
  oculta?: boolean;
  anchoMinimo?: number;
  /** Sección: agrupa en el modal Columnas y en la franja sobre los encabezados. */
  columnClass: string;
}

interface CxpSchema {
  columns: Record<string, CxpColumnMeta>;
  reportTypes: Record<CxpReportType, string[]>;
}

const constructorColumnas = new ColumnBuilder<CxpReportType, ReportPayablesRecord>(
  schema as CxpSchema,
);

/** Las 44 columnas del contrato, con el proveedor fijo a la izquierda. */
export const construirColumnasCxp = (): ColDef<ReportPayablesRecord>[] =>
  constructorColumnas
    .construirColumnas("default")
    .map((columna) =>
      columna.field === "proveedor" ? { ...columna, initialPinned: "left" } : columna,
    );
