import type { ReportPurchaseItemRecord } from "@repgen/shared-types";

export interface ResumenCompras {
  /** "Resultado": Σ del gran total de cada concepto. */
  granTotal: number;
  importeConDescuento: number;
  iva: number;
  ivaRetenido: number;
  isrRetenido: number;
  /** Gran total por tipo de concepto (Stock, Gasto…). */
  porTipo: Record<string, number>;
  /** Total y saldo de la factura: se repiten en cada concepto, una vez por compra. */
  facturasGranTotal: number;
  saldo: number;
}

/** KPIs de la ficha (Resumen / KPIs). Todo en MXN. */
export const resumenCompras = (filas: ReportPurchaseItemRecord[]): ResumenCompras => {
  const r: ResumenCompras = {
    granTotal: 0,
    importeConDescuento: 0,
    iva: 0,
    ivaRetenido: 0,
    isrRetenido: 0,
    porTipo: {},
    facturasGranTotal: 0,
    saldo: 0,
  };
  const compras = new Set<number>();
  for (const f of filas) {
    const total = f.articuloGranTotalMxn ?? 0;
    r.granTotal += total;
    r.importeConDescuento += f.articuloImporteConDescuentoMxn ?? 0;
    r.iva += f.articuloIVAMxn ?? 0;
    r.ivaRetenido += f.articuloIVARetenidoMxn ?? 0;
    r.isrRetenido += f.articuloISRretenidoMxn ?? 0;
    r.porTipo[f.tipoDeConcepto] = (r.porTipo[f.tipoDeConcepto] ?? 0) + total;
    if (compras.has(f.compraId)) continue;
    compras.add(f.compraId);
    r.facturasGranTotal += f.facturaGranTotalMxn ?? 0;
    r.saldo += f.facturaSaldoActual ?? 0;
  }
  return r;
};

/** Resultado del periodo, para comparar contra el anterior. */
export const granTotalCompras = (filas: ReportPurchaseItemRecord[]) =>
  resumenCompras(filas).granTotal;
