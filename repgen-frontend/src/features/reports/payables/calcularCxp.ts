import type {
  ReportPayablesRecord,
  ReportPayablesSupplierRecord,
} from "@repgen/shared-types";

/** Última fila de la vista por proveedor: los cargos sin proveedor, juntos. */
export const SIN_IDENTIFICAR = "EGRESOS SIN IDENTIFICAR";

export interface TotalesCxp {
  pendiente: number;
  vencido: number;
  porVencer: number;
  /** Saldo de las facturas "No pagar" (fuera del pendiente). */
  noPagar: number;
  cargosNoAplicados: number;
  abonosNoAplicados: number;
  sinIdentificar: number;
  /** Saldo vencido por días de atraso. */
  antiguedad: { d1a30: number; d31a60: number; d61a90: number; mas90: number };
}

const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Totales del resumen sobre las filas que dejan los filtros de la tabla, de
 * la vista por compra o por proveedor (esta no trae antigüedad).
 */
export const calcularTotalesCxp = (
  filas: (ReportPayablesRecord | ReportPayablesSupplierRecord)[],
): TotalesCxp => {
  const t = {
    pendiente: 0,
    vencido: 0,
    porVencer: 0,
    noPagar: 0,
    cargosNoAplicados: 0,
    abonosNoAplicados: 0,
    sinIdentificar: 0,
    antiguedad: { d1a30: 0, d31a60: 0, d61a90: 0, mas90: 0 },
  };
  for (const f of filas) {
    t.pendiente += f.facturaSaldoPendiente ?? 0;
    t.vencido += f.facturaSaldoVencido ?? 0;
    t.porVencer += f.facturaSaldoPorVencer ?? 0;
    t.noPagar += f.facturaNoPagarMonto ?? 0;
    t.abonosNoAplicados += f.abonoSaldoNoAplicado ?? 0;
    if ("proveedorSaldoFiscal" in f) {
      if (f.proveedor === SIN_IDENTIFICAR) t.sinIdentificar += f.cargoSaldoNoAplicado ?? 0;
      else t.cargosNoAplicados += f.cargoSaldoNoAplicado ?? 0;
      continue;
    }
    t.cargosNoAplicados += f.cargoSaldoNoAplicado ?? 0;
    t.sinIdentificar += f.cargoMontoSinIdentificar ?? 0;

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
    noPagar: redondear(t.noPagar),
    cargosNoAplicados: redondear(t.cargosNoAplicados),
    abonosNoAplicados: redondear(t.abonosNoAplicados),
    sinIdentificar: redondear(t.sinIdentificar),
    antiguedad: {
      d1a30: redondear(t.antiguedad.d1a30),
      d31a60: redondear(t.antiguedad.d31a60),
      d61a90: redondear(t.antiguedad.d61a90),
      mas90: redondear(t.antiguedad.mas90),
    },
  };
};
