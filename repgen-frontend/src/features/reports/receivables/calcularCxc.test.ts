import { describe, expect, it } from "vitest";
import type { ReportReceivablesRecord } from "@repgen/shared-types";
import { calcularTotalesCxc } from "./calcularCxc";

const fila = (parcial: Partial<ReportReceivablesRecord>) => parcial as ReportReceivablesRecord;

describe("calcularTotalesCxc", () => {
  it("suma saldos por tipo, el neto y la antigüedad del vencido", () => {
    const t = calcularTotalesCxc([
      fila({ facturaSaldoPendiente: 100, facturaSaldoVencido: 100, facturaSaldoPorVencer: 0, facturaDiasVencida: 30 }),
      fila({ facturaSaldoPendiente: 50, facturaSaldoVencido: 50, facturaSaldoPorVencer: 0, facturaDiasVencida: 31 }),
      fila({ facturaSaldoPendiente: 0, facturaSaldoVencido: 0, facturaSaldoPorVencer: 0, facturaNoCobrarGranTotal: 40, facturaEstatus: "No cobrar" }),
      fila({ facturaSaldoPendiente: 20.1, facturaSaldoVencido: 20.1, facturaSaldoPorVencer: 0, facturaDiasVencida: 171 }),
      fila({ facturaSaldoPendiente: 0.2, facturaSaldoVencido: 0, facturaSaldoPorVencer: 0.2, facturaDiasVencida: 0 }),
      fila({ abonoSaldoNoAplicado: 70 }),
      fila({ cargoSaldoNoAplicado: 5 }),
      fila({ abonoMontoSinIdentificar: 9 }),
    ]);
    expect(t).toEqual({
      pendiente: 170.3,
      vencido: 170.1,
      porVencer: 0.2,
      noCobrar: 40,
      abonosNoAplicados: 70,
      cargosNoAplicados: 5,
      sinIdentificar: 9,
      neto: 100.3,
      antiguedad: { d1a30: 100, d31a60: 50, d61a90: 0, mas90: 20.1 },
    });
  });

  it("sin filas todo es cero", () => {
    expect(calcularTotalesCxc([]).pendiente).toBe(0);
  });
});
