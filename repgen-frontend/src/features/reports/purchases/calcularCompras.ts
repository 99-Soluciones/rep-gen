import type { EstatusCompra, ReportPurchaseRecord } from "@repgen/shared-types";

export interface GrupoEstatus {
  compras: number;
  saldo: number;
}

export interface ResumenComprasGeneral {
  /** "Resultado": Σ del gran total de las compras. */
  granTotal: number;
  importeConDescuento: number;
  iva: number;
  ivaRetenido: number;
  isrRetenido: number;
  saldo: number;
  porEstatus: Record<EstatusCompra, GrupoEstatus>;
}

/** KPIs de la ficha (Resumen / KPIs). Cada fila es una compra; todo en MXN. */
export const resumenComprasGeneral = (filas: ReportPurchaseRecord[]): ResumenComprasGeneral => {
  const r: ResumenComprasGeneral = {
    granTotal: 0,
    importeConDescuento: 0,
    iva: 0,
    ivaRetenido: 0,
    isrRetenido: 0,
    saldo: 0,
    porEstatus: {
      Liquidado: { compras: 0, saldo: 0 },
      Vencida: { compras: 0, saldo: 0 },
      Vigente: { compras: 0, saldo: 0 },
    },
  };
  for (const f of filas) {
    r.granTotal += f.facturaGranTotalMxn ?? 0;
    r.importeConDescuento += f.importeConDescuentoMxn ?? 0;
    r.iva += f.ivaMxn ?? 0;
    r.ivaRetenido += f.ivaRetenidoMxn ?? 0;
    r.isrRetenido += f.isrRetenidoMxn ?? 0;
    r.saldo += f.facturaSaldoActual ?? 0;
    const grupo = r.porEstatus[f.facturaEstatus];
    if (!grupo) continue;
    grupo.compras += 1;
    grupo.saldo += f.facturaSaldoActual ?? 0;
  }
  return r;
};

/** Resultado del periodo, para comparar contra el anterior. */
export const granTotalComprasGeneral = (filas: ReportPurchaseRecord[]) =>
  resumenComprasGeneral(filas).granTotal;
