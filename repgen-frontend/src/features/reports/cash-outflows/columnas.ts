import type { ColDef } from "ag-grid-community";
import type { DetalleEgresos, ReportCashOutflowRecord } from "@repgen/shared-types";

import schema from "./egresos.schema.json";
import {
  ColumnBuilder,
  type LabelResolver,
  type ReportColumnMeta,
} from "../shared/ag-grid/construir-columnas";

interface EgresosSchema {
  columns: Record<string, ReportColumnMeta>;
  reportTypes: Record<DetalleEgresos, string[]>;
}

const constructorColumnas = new ColumnBuilder<DetalleEgresos, ReportCashOutflowRecord>(
  schema as EgresosSchema,
);

export const construirColumnasEgresos = (
  detalle: DetalleEgresos,
  labelResolver?: LabelResolver,
): ColDef<ReportCashOutflowRecord>[] => constructorColumnas.construirColumnas(detalle, labelResolver);
