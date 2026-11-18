import type { ReportBankComplementRecord } from "@repgen/shared-types";

export interface ResumenMoneda {
  abonos: number;
  cargos: number;
  porIdentificar: number;
  porComplementar: number;
}

export interface ResumenComplementos {
  /** Montos del movimiento, en su moneda, una vez por movimiento. */
  porMoneda: Record<string, ResumenMoneda>;
  /** Σ de los complementos (siempre MXN), uno por renglón. */
  pagosMxn: number;
}

/**
 * El movimiento se repite en cada renglón de sus complementos: abono, cargo y
 * saldos se cuentan una vez por movimiento; el pago, en cada renglón.
 */
export const resumenComplementos = (filas: ReportBankComplementRecord[]): ResumenComplementos => {
  const porMoneda: Record<string, ResumenMoneda> = {};
  const vistos = new Set<number>();
  let pagosMxn = 0;
  for (const fila of filas) {
    pagosMxn += fila.pagoGranTotalMxn ?? 0;
    if (vistos.has(fila.bancoFolioTransaccion)) continue;
    vistos.add(fila.bancoFolioTransaccion);
    const moneda = (fila.bancoMoneda || "MXN").toUpperCase();
    const actual = (porMoneda[moneda] ??= { abonos: 0, cargos: 0, porIdentificar: 0, porComplementar: 0 });
    actual.abonos += fila.bancoAbono ?? 0;
    actual.cargos += fila.bancoCargo ?? 0;
    actual.porIdentificar += fila.bancoSaldoPorIdentificar ?? 0;
    actual.porComplementar += fila.bancoSaldoPorComplementar ?? 0;
  }
  return { porMoneda, pagosMxn };
};

/** Flujo neto en MXN (abonos − cargos, una vez por movimiento). */
export const flujoNetoMxnComplementos = (filas: ReportBankComplementRecord[]) => {
  const mxn = resumenComplementos(filas).porMoneda.MXN;
  return mxn ? mxn.abonos - mxn.cargos : 0;
};
