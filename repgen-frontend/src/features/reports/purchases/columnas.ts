import type { ColDef } from "ag-grid-community";
import type { ReportPurchaseRecord } from "@repgen/shared-types";

import schema from "./compras.schema.json";
import { ColumnBuilder, type ReportColumnMeta } from "../shared/ag-grid/construir-columnas";

interface ComprasSchema {
  columns: Record<string, ReportColumnMeta>;
  reportTypes: Record<"default", string[]>;
}

const constructorColumnas = new ColumnBuilder<"default", ReportPurchaseRecord>(
  schema as ComprasSchema,
);

export const columnasCompras: ColDef<ReportPurchaseRecord>[] =
  constructorColumnas.construirColumnas("default");
