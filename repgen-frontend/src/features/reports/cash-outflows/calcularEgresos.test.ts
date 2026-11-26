import { describe, expect, it } from "vitest";
import type { ReportCashOutflowRecord } from "@repgen/shared-types";
import { calcularTotalesEgresos, totalEgresos } from "./calcularEgresos";

const fila = (parcial: Partial<ReportCashOutflowRecord>) => parcial as ReportCashOutflowRecord;

// Totales por tipo y banco de los datos dorados (vista por factura, 01–24/11/2026).
const dorados = [
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Egresos", pagoGranTotalMxn: 629643.74 }),
  fila({ tipoRenglon: "Pago sin aplicar", bancoNombre: "BBVA Egresos", pagoGranTotalMxn: 91701.15 }),
  fila({ tipoRenglon: "Pago no identificado", bancoNombre: "BBVA Egresos", pagoGranTotalMxn: 601287.2 }),
  fila({ tipoRenglon: "Pago no identificado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 93253.59 }),
  fila({ tipoRenglon: "Traspaso entre cuentas", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 997500 }),
];

describe("calcularTotalesEgresos", () => {
  it("da las cifras de los datos dorados: total, desglose por tipo y por banco", () => {
    expect(calcularTotalesEgresos(dorados)).toEqual({
      total: 2413385.68,
      aplicado: 629643.74,
      sinAplicar: 91701.15,
      noIdentificado: 694540.79,
      traspasos: 997500,
      porBanco: [
        { banco: "BBVA Egresos", monto: 1322632.09 },
        { banco: "BBVA Ingresos", monto: 1090753.59 },
      ],
    });
    expect(totalEgresos(dorados)).toBe(2413385.68);
  });

  it("agrupa por banco de mayor a menor; sin nombre va en 'Sin banco'", () => {
    const t = calcularTotalesEgresos([
      fila({ tipoRenglon: "Pago aplicado", bancoNombre: "Banorte", pagoGranTotalMxn: 10.1 }),
      fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA", pagoGranTotalMxn: 0.2 }),
      fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA", pagoGranTotalMxn: 20 }),
      fila({ tipoRenglon: "Pago no identificado", bancoNombre: "", pagoGranTotalMxn: 5 }),
    ]);
    expect(t.porBanco).toEqual([
      { banco: "BBVA", monto: 20.2 },
      { banco: "Banorte", monto: 10.1 },
      { banco: "Sin banco", monto: 5 },
    ]);
    // La suma de centavos no arrastra error de punto flotante.
    expect(t.total).toBe(35.3);
  });

  it("sin filas todo es cero", () => {
    expect(calcularTotalesEgresos([])).toEqual({
      total: 0,
      aplicado: 0,
      sinAplicar: 0,
      noIdentificado: 0,
      traspasos: 0,
      porBanco: [],
    });
  });
});
