import type { ColDef } from "ag-grid-community";

import schema from "./bancos.schema.json";

import type { IBancoData } from "../../../../interfaces/reportes/interface.bancos";
import { ColumnBuilder } from "../construir-columnas.ag-grid";
import type { AgGridDataType } from "../filtros.ag-grid";

type BancosReportType = "default";

interface BancosColumnMeta {
  field: string;
  dataType: AgGridDataType;
}

interface BancosSchema {
  columns: Record<string, BancosColumnMeta>;
  reportTypes: Record<BancosReportType, string[]>;
}

const esquemaBancos = schema as BancosSchema;

const constructorColumnas = new ColumnBuilder<BancosReportType, IBancoData>(esquemaBancos);

const construirColumnasBancos = (
  reportType: BancosReportType,
): ColDef<IBancoData>[] => {
  return constructorColumnas.construirColumnas(reportType);
};

export const columnasBancos = construirColumnasBancos("default");
