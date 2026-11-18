import type { ColDef } from "ag-grid-community";
import type { ReportBankComplementRecord } from "@repgen/shared-types";

import schema from "./bancos-complementos.schema.json";
import { ColumnBuilder, type ReportColumnMeta } from "../shared/ag-grid/construir-columnas";

interface BancosComplementosSchema {
  columns: Record<string, ReportColumnMeta>;
  reportTypes: Record<"default", string[]>;
}

const constructorColumnas = new ColumnBuilder<"default", ReportBankComplementRecord>(
  schema as BancosComplementosSchema,
);

export const columnasBancosComplementos: ColDef<ReportBankComplementRecord>[] =
  constructorColumnas.construirColumnas("default");
