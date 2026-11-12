import { describe, expect, it } from "vitest";
import type { ReportCashInflowRecord } from "@repgen/shared-types";
import { calcularTotalesIngresos, totalIngresos } from "./calcularIngresos";

const fila = (parcial: Partial<ReportCashInflowRecord>) => parcial as ReportCashInflowRecord;

// Los renglones de los datos dorados (vista por factura, octubre 2026).
const dorados = [
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 3500 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 960 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 3000 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 0.03 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 0.47 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 22968.97 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 407.89 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 6864.11 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 10339.35 }),
  fila({ tipoRenglon: "Pago aplicado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 1500.3 }),
  fila({ tipoRenglon: "Pago sin aplicar", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 48 }),
  fila({ tipoRenglon: "Pago no identificado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 5738.54 }),
  fila({ tipoRenglon: "Pago no identificado", bancoNombre: "BBVA Ingresos", pagoGranTotalMxn: 550000 }),
];

describe("calcularTotalesIngresos", () => {
  it("da las cifras de los datos dorados: total y desglose por tipo", () => {
    expect(calcularTotalesIngresos(dorados)).toEqual({
      total: 605327.66,
      aplicado: 49541.12,
      sinAplicar: 48,
      noIdentificado: 555738.54,
      porBanco: [{ banco: "BBVA Ingresos", monto: 605327.66 }],
    });
    expect(totalIngresos(dorados)).toBe(605327.66);
  });

  it("agrupa por banco de mayor a menor; sin nombre va en 'Sin banco'", () => {
    const t = calcularTotalesIngresos([
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
    expect(calcularTotalesIngresos([])).toEqual({
      total: 0,
      aplicado: 0,
      sinAplicar: 0,
      noIdentificado: 0,
      porBanco: [],
    });
  });
});
