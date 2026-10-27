import type { ReportBankRecord } from "@repgen/shared-types";

export interface MovimientosMoneda {
  abonos: number;
  cargos: number;
}

/** Abonos y cargos por moneda; cada moneda se suma aparte, nunca con otra. */
export const movimientosPorMoneda = (filas: ReportBankRecord[]): Record<string, MovimientosMoneda> => {
  const porMoneda: Record<string, MovimientosMoneda> = {};
  for (const fila of filas) {
    const moneda = (fila.moneda || "MXN").toUpperCase();
    const actual = (porMoneda[moneda] ??= { abonos: 0, cargos: 0 });
    actual.abonos += fila.abono || 0;
    actual.cargos += fila.cargo || 0;
  }
  return porMoneda;
};

/** Flujo neto en MXN: lo que el resumen y la comparación con el periodo anterior usan. */
export const flujoNetoMxn = (filas: ReportBankRecord[]) => {
  const mxn = movimientosPorMoneda(filas).MXN;
  return mxn ? mxn.abonos - mxn.cargos : 0;
};

export interface SaldoCuenta {
  banco: string;
  cuenta: string;
  moneda: string;
  saldo: number;
  fecha: string;
}

/**
 * Saldo al cierre de cada cuenta: el Saldo Resultante (saldo corrido de
 * FileMaker) del último movimiento de la cuenta en el rango. "Último" es la
 * fecha más reciente y, en el mismo día, el id de transacción mayor.
 */
export const saldosAlCierre = (filas: ReportBankRecord[]): SaldoCuenta[] => {
  const ultimo = new Map<string, ReportBankRecord>();
  for (const fila of filas) {
    if (fila.saldoBanco == null) continue;
    const clave = `${fila.nombre_banco ?? ""}|${fila.numero_cuenta ?? ""}`;
    const previo = ultimo.get(clave);
    const despues =
      !previo ||
      fila.fecha > previo.fecha ||
      (fila.fecha === previo.fecha && Number(fila.idTransaccionBanco) > Number(previo.idTransaccionBanco));
    if (despues) ultimo.set(clave, fila);
  }
  return [...ultimo.values()]
    .map((fila) => ({
      banco: fila.nombre_banco ?? "Sin banco",
      cuenta: fila.numero_cuenta ?? "",
      moneda: (fila.moneda || "MXN").toUpperCase(),
      saldo: fila.saldoBanco ?? 0,
      fecha: fila.fecha,
    }))
    .sort((a, b) => a.banco.localeCompare(b.banco, "es") || a.cuenta.localeCompare(b.cuenta));
};
