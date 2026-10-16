import type { ColDef } from "ag-grid-community";

import schema from "./bancos.schema.json";

import type { ReportBankRecord } from "@repgen/shared-types";
import { ColumnBuilder } from "../shared/ag-grid/construir-columnas";
import type { AgGridDataType } from "../shared/ag-grid/parametros-filtro";

type BancosReportType = "default";

interface BancosColumnMeta {
  field: string;
  dataType: AgGridDataType;
  /** "lista": se filtra marcando valores (pocas opciones: banco, moneda, estatus…). */
  filtro?: "lista";
  /** Empieza oculta (dato técnico); se muestra desde Columnas o una vista. */
  oculta?: boolean;
}

interface BancosSchema {
  columns: Record<string, BancosColumnMeta>;
  reportTypes: Record<BancosReportType, string[]>;
}

const esquemaBancos = schema as BancosSchema;

const constructorColumnas = new ColumnBuilder<BancosReportType, ReportBankRecord>(esquemaBancos);

const construirColumnasBancos = (
  reportType: BancosReportType,
): ColDef<ReportBankRecord>[] => {
  return constructorColumnas.construirColumnas(reportType);
};

export const columnasBancos = construirColumnasBancos("default");
