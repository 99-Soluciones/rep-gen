import type { ColDef } from "ag-grid-community";
import type { DetalleIngresos, ReportCashInflowRecord } from "@repgen/shared-types";

import schema from "./ingresos.schema.json";
import {
  ColumnBuilder,
  type LabelResolver,
  type ReportColumnMeta,
} from "../shared/ag-grid/construir-columnas";

interface IngresosSchema {
  columns: Record<string, ReportColumnMeta>;
  reportTypes: Record<DetalleIngresos, string[]>;
}

const constructorColumnas = new ColumnBuilder<DetalleIngresos, ReportCashInflowRecord>(
  schema as IngresosSchema,
);

export const construirColumnasIngresos = (
  detalle: DetalleIngresos,
  labelResolver?: LabelResolver,
): ColDef<ReportCashInflowRecord>[] => constructorColumnas.construirColumnas(detalle, labelResolver);
