import type { ColDef } from "ag-grid-community";
import type { ReportPurchaseItemRecord } from "@repgen/shared-types";

import schema from "./compras-conceptos.schema.json";
import {
  ColumnBuilder,
  type LabelResolver,
  type ReportColumnMeta,
} from "../shared/ag-grid/construir-columnas";

interface ComprasConceptosSchema {
  columns: Record<string, ReportColumnMeta>;
  reportTypes: Record<"default", string[]>;
}

const constructorColumnas = new ColumnBuilder<"default", ReportPurchaseItemRecord>(
  schema as ComprasConceptosSchema,
);

/** Las categorías toman su encabezado de "Etiquetas de columnas" (articulo.categoria1…4). */
export const construirColumnasComprasConceptos = (
  labelResolver?: LabelResolver,
): ColDef<ReportPurchaseItemRecord>[] =>
  constructorColumnas.construirColumnas("default", labelResolver);
