import type { ColDef } from "ag-grid-community";

import schema from "./ventas.schema.json";

import {
  type AgGridDataType,
} from "../shared/ag-grid/parametros-filtro";

import {
  ColumnBuilder,
  type LabelResolver,
} from "../shared/ag-grid/construir-columnas";
import type { ReportSalesItemRecord } from "@repgen/shared-types";

export type VentasReportType = "factura" | "conceptos";

interface VentasColumnMeta {
  field: string;
  dataType: AgGridDataType;
  columnClass?: string;
  defaultHeader?: string;
  labelSlot?: string;
}

interface VentasSchema {
  columns: Record<string, VentasColumnMeta>;
  reportTypes: Record<VentasReportType, string[]>;
}

const esquemaVentas = schema as VentasSchema;

const constructorColumnas = new ColumnBuilder<VentasReportType, ReportSalesItemRecord>(
  esquemaVentas,
);

export const construirColumnasVentas = (
  reportType: VentasReportType,
  labelResolver?: LabelResolver,
): ColDef<ReportSalesItemRecord>[] => {
  return constructorColumnas.construirColumnas(reportType, labelResolver);
};
