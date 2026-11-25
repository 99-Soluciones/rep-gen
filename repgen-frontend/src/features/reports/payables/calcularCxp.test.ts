import { describe, expect, it } from "vitest";
import type {
  ReportPayablesRecord,
  ReportPayablesSupplierRecord,
} from "@repgen/shared-types";
import { calcularTotalesCxp } from "./calcularCxp";
import esperadoProveedor from "../../../../../repgen-backend/src/reports/infrastructure/payables/__golden__/esperado-proveedor.json";
import esperado from "../../../../../repgen-backend/src/reports/infrastructure/payables/__golden__/esperado.json";

describe("calcularTotalesCxp", () => {
  it("sobre los datos dorados (corte 15/07/2026) da las cifras del borrador aprobado", () => {
    expect(calcularTotalesCxp(esperado as ReportPayablesRecord[])).toEqual({
      pendiente: 133183.24,
      vencido: 67898.24,
      porVencer: 65285,
      noPagar: 7500.01,
      cargosNoAplicados: 24796.39,
      abonosNoAplicados: 0,
      sinIdentificar: 5920,
      antiguedad: { d1a30: 11681.4, d31a60: 0, d61a90: 0, mas90: 56216.84 },
    });
  });

  it("la vista por proveedor da los mismos saldos; los no identificados salen de su fila", () => {
    const porProveedor = calcularTotalesCxp(esperadoProveedor as ReportPayablesSupplierRecord[]);
    const porCompra = calcularTotalesCxp(esperado as ReportPayablesRecord[]);
    expect({ ...porProveedor, antiguedad: null }).toEqual({ ...porCompra, antiguedad: null });
  });

  it("sin filas todo es cero", () => {
    expect(calcularTotalesCxp([]).pendiente).toBe(0);
  });
});
