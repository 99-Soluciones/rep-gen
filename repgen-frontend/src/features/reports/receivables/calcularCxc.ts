import type { ReportReceivablesRecord } from "@repgen/shared-types";

export interface TotalesCxc {
  pendiente: number;
  vencido: number;
  porVencer: number;
  /** Saldo de las facturas "No cobrar" (fuera del pendiente). */
  noCobrar: number;
  abonosNoAplicados: number;
  cargosNoAplicados: number;
  sinIdentificar: number;
  /** Saldo pendiente − abonos no aplicados. */
  neto: number;
  /** Saldo vencido por días de atraso. */
  antiguedad: { d1a30: number; d31a60: number; d61a90: number; mas90: number };
}

const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Totales del resumen sobre las filas que dejan los filtros de la tabla. */
export const calcularTotalesCxc = (filas: ReportReceivablesRecord[]): TotalesCxc => {
  const t = {
    pendiente: 0,
    vencido: 0,
    porVencer: 0,
    noCobrar: 0,
    abonosNoAplicados: 0,
    cargosNoAplicados: 0,
    sinIdentificar: 0,
    antiguedad: { d1a30: 0, d31a60: 0, d61a90: 0, mas90: 0 },
  };
  for (const f of filas) {
    t.pendiente += f.facturaSaldoPendiente ?? 0;
    t.vencido += f.facturaSaldoVencido ?? 0;
    t.porVencer += f.facturaSaldoPorVencer ?? 0;
    t.noCobrar += f.facturaNoCobrarGranTotal ?? 0;
    t.abonosNoAplicados += f.abonoSaldoNoAplicado ?? 0;
    t.cargosNoAplicados += f.cargoSaldoNoAplicado ?? 0;
    t.sinIdentificar += f.abonoMontoSinIdentificar ?? 0;

    const dias = f.facturaDiasVencida ?? 0;
    const vencido = f.facturaSaldoVencido ?? 0;
    if (!vencido) continue;
    if (dias <= 30) t.antiguedad.d1a30 += vencido;
    else if (dias <= 60) t.antiguedad.d31a60 += vencido;
    else if (dias <= 90) t.antiguedad.d61a90 += vencido;
    else t.antiguedad.mas90 += vencido;
  }
  return {
    pendiente: redondear(t.pendiente),
    vencido: redondear(t.vencido),
    porVencer: redondear(t.porVencer),
    noCobrar: redondear(t.noCobrar),
    abonosNoAplicados: redondear(t.abonosNoAplicados),
    cargosNoAplicados: redondear(t.cargosNoAplicados),
    sinIdentificar: redondear(t.sinIdentificar),
    neto: redondear(t.pendiente - t.abonosNoAplicados),
    antiguedad: {
      d1a30: redondear(t.antiguedad.d1a30),
      d31a60: redondear(t.antiguedad.d31a60),
      d61a90: redondear(t.antiguedad.d61a90),
      mas90: redondear(t.antiguedad.mas90),
    },
  };
};
