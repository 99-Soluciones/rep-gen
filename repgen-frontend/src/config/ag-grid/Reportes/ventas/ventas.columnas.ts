import type { ColDef } from "ag-grid-community";

import schema from "./ventas.schema.json";

import {
  type AgGridDataType,
} from "../filtros.ag-grid";

import {
  ColumnBuilder,
  type LabelResolver,
} from "../construir-columnas.ag-grid";
import type { IVentaData } from "../../../../interfaces/reportes/interface.ventas";

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

const constructorColumnas = new ColumnBuilder<VentasReportType, IVentaData>(
  esquemaVentas,
);

export const construirColumnasVentas = (
  reportType: VentasReportType,
  labelResolver?: LabelResolver,
): ColDef<IVentaData>[] => {
  return constructorColumnas.construirColumnas(reportType, labelResolver);
};
