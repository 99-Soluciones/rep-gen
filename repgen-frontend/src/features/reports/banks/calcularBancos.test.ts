import type { ReportBankRecord } from "@repgen/shared-types";
import { flujoNetoMxn, movimientosPorMoneda, saldosAlCierre } from "./calcularBancos";

const mov = (m: Partial<ReportBankRecord>): ReportBankRecord => ({
  idTransaccionBanco: 1,
  fecha: "2026-10-01",
  formaPago: "",
  concepto: "",
  saldoPorComplementar: 0,
  moneda: "MXN",
  ...m,
});

describe("calcularBancos", () => {
  it("suma cada moneda aparte, nunca juntas", () => {
    const filas = [
      mov({ abono: 1000 }),
      mov({ cargo: 400 }),
      mov({ moneda: "USD", abono: 50 }),
      mov({ moneda: "usd", cargo: 20 }),
    ];
    expect(movimientosPorMoneda(filas)).toEqual({
      MXN: { abonos: 1000, cargos: 400 },
      USD: { abonos: 50, cargos: 20 },
    });
    expect(flujoNetoMxn(filas)).toBe(600);
  });

  it("el saldo al cierre es el del último movimiento de cada cuenta (fecha, luego id)", () => {
    const filas = [
      mov({ nombre_banco: "BBVA", numero_cuenta: "0123", fecha: "2026-10-03", idTransaccionBanco: 5, saldoBanco: 900 }),
      mov({ nombre_banco: "BBVA", numero_cuenta: "0123", fecha: "2026-10-03", idTransaccionBanco: 7, saldoBanco: 850 }),
      mov({ nombre_banco: "BBVA", numero_cuenta: "0123", fecha: "2026-10-01", idTransaccionBanco: 9, saldoBanco: 1000 }),
      mov({ nombre_banco: "Banorte", numero_cuenta: "9876", moneda: "USD", fecha: "2026-10-02", saldoBanco: -15 }),
    ];
    expect(saldosAlCierre(filas)).toEqual([
      { banco: "Banorte", cuenta: "9876", moneda: "USD", saldo: -15, fecha: "2026-10-02" },
      { banco: "BBVA", cuenta: "0123", moneda: "MXN", saldo: 850, fecha: "2026-10-03" },
    ]);
  });
});
