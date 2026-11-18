import type { ReportBankComplementRecord } from "@repgen/shared-types";
import { flujoNetoMxnComplementos, resumenComplementos } from "./calcularBancosComplementos";

const fila = (valores: Partial<ReportBankComplementRecord>) =>
  ({ bancoMoneda: "MXN", bancoAbono: null, bancoCargo: null, pagoGranTotalMxn: null, ...valores }) as ReportBankComplementRecord;

describe("resumenComplementos", () => {
  it("cuenta el movimiento una vez aunque tenga varios complementos", () => {
    // 7388: abono de 3,024 con dos complementos y $48 sin identificar.
    const filas = [
      fila({ bancoFolioTransaccion: 7388, bancoAbono: 3024, bancoSaldoPorIdentificar: 48, bancoSaldoPorComplementar: 48, pagoGranTotalMxn: 2016 }),
      fila({ bancoFolioTransaccion: 7388, bancoAbono: 3024, bancoSaldoPorIdentificar: 48, bancoSaldoPorComplementar: 48, pagoGranTotalMxn: 960 }),
      fila({ bancoFolioTransaccion: 7360, bancoCargo: 2513.14, bancoSaldoPorComplementar: 2513.14 }),
    ];
    const { porMoneda, pagosMxn } = resumenComplementos(filas);
    expect(porMoneda.MXN).toEqual({ abonos: 3024, cargos: 2513.14, porIdentificar: 48, porComplementar: 2561.14 });
    expect(pagosMxn).toBe(2976);
    expect(flujoNetoMxnComplementos(filas)).toBeCloseTo(510.86);
  });

  it("no suma monedas distintas", () => {
    const { porMoneda } = resumenComplementos([
      fila({ bancoFolioTransaccion: 1, bancoAbono: 100 }),
      fila({ bancoFolioTransaccion: 2, bancoAbono: 10, bancoMoneda: "USD" }),
    ]);
    expect(porMoneda.MXN.abonos).toBe(100);
    expect(porMoneda.USD.abonos).toBe(10);
  });
});
