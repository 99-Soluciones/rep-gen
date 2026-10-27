import type { AgGridReact } from "ag-grid-react";
import type { RefObject } from "react";
import { useState } from "react";
import type { VentasRouteType } from "./ReporteVentas";

export interface TotalesVentas {
  totalVentas: number;
  totalCancelaciones: number;
  totalDevoluciones: number;
  facturacionNeta: number;
  importeSinDescuentos: number;
  descuentos: number;
  importeConDescuentos: number;
  gananciaBruta: number;
  costoDirecto: number;
  /** Conceptos: facturas distintas con venta (las filas son artículos). */
  facturas: number;
  facturasVencidas: number;
  facturasPagadas: number;
  facturasVigentes: number;
  facturasCanceladas: number;
  devoluciones: number;
}

const totalesIniciales: TotalesVentas = {
  totalVentas: 0,
  totalCancelaciones: 0,
  totalDevoluciones: 0,
  facturacionNeta: 0,
  importeSinDescuentos: 0,
  descuentos: 0,
  importeConDescuentos: 0,
  gananciaBruta: 0,
  costoDirecto: 0,
  facturas: 0,
  facturasVencidas: 0,
  facturasPagadas: 0,
  facturasVigentes: 0,
  facturasCanceladas: 0,
  devoluciones: 0,
};

// Filas de ventas tal como llegan de la API (facturas o conceptos).
type FilaVentas = Record<string, unknown>;

/**
 * Si la fila entra a la Facturación neta: las ventas (monto positivo) y, en
 * negativo, solo cancelaciones y devoluciones. El pie de la tabla suma con esta
 * misma regla, así su Gran Total es la Facturación neta del resumen.
 */
export const cuentaEnNeto = (
  fila: { facturaGranTotalMxn?: unknown; articuloImporteConDescuentoMxn?: unknown; facturaEstatus?: unknown },
  currentType: VentasRouteType,
): boolean => {
  const monto = Number(
    currentType === "facturas" ? fila.facturaGranTotalMxn : fila.articuloImporteConDescuentoMxn,
  );
  return monto > 0 || (monto < 0 && (fila.facturaEstatus === "Cancelada" || fila.facturaEstatus === "Devolución"));
};

/**
 * Totales del resumen de Ventas sobre las filas dadas. Función pura: el
 * resumen la aplica a las filas filtradas de la tabla y la comparación con el
 * periodo anterior a todas las filas de ese periodo, con el mismo cálculo.
 */
export const calcularTotalesVentas = (
  filas: FilaVentas[],
  currentType: VentasRouteType,
): TotalesVentas => {
  const t = { ...totalesIniciales };

  if (currentType === "facturas") {
    for (const fila of filas) {
      const total = Number(fila.facturaGranTotalMxn);
      if (fila.facturaGranTotalMxn) {
        t.totalVentas += total > 0 ? total : 0;
        t.totalCancelaciones += fila.facturaEstatus === "Cancelada" && total < 0 ? total : 0;
        t.totalDevoluciones += fila.facturaEstatus === "Devolución" && total < 0 ? total : 0;
      }
      // Mismas filas que el neto (y que el pie): cancelaciones y devoluciones llegan negadas.
      t.importeSinDescuentos += cuentaEnNeto(fila, currentType) ? Number(fila.importeSinDescuentoMxn) || 0 : 0;
      t.facturasVencidas += fila.facturaEstatus === "Vencida" && total > 0 ? 1 : 0;
      t.facturasPagadas += fila.facturaEstatus === "Pagada" && total > 0 ? 1 : 0;
      t.facturasVigentes += fila.facturaEstatus === "Vigente" && total > 0 ? 1 : 0;
      t.facturasCanceladas += fila.facturaEstatus === "Cancelada" && total < 0 ? 1 : 0;
      t.devoluciones += fila.facturaEstatus === "Devolución" && total < 0 ? 1 : 0;
    }
  } else {
    const ventas = new Set<unknown>();
    for (const fila of filas) {
      if (!fila.articuloImporteConDescuentoMxn) continue;
      const importe = Number(fila.articuloImporteConDescuentoMxn);
      const suma =
        importe +
        Number(fila.articuloIVAMxn) +
        Number(fila.articuloIEPSMxn) +
        Number(fila.articuloIVARetenidoMxn) +
        Number(fila.articuloISRretenidoMxn);
      t.totalVentas += importe > 0 ? suma : 0;
      t.totalCancelaciones += importe < 0 && fila.facturaEstatus === "Cancelada" ? suma : 0;
      t.totalDevoluciones += importe < 0 && fila.facturaEstatus === "Devolución" ? suma : 0;
      if (importe > 0) ventas.add(fila.ventaId);
      // Mismas filas que el neto y que el pie de la tabla.
      if (!cuentaEnNeto(fila, currentType)) continue;
      t.importeSinDescuentos += Number(fila.articuloImporteSinDescuentoMxn) || 0;
      t.descuentos += Number(fila.articuloDescuentoMontoMxn) || 0;
      t.importeConDescuentos += importe;
      t.gananciaBruta += Number(fila.gananciaBrutaMxn) || 0;
      t.costoDirecto += Number(fila.costoDirectoSubTotalMxn) || 0;
    }
    t.facturas = ventas.size;
  }

  t.facturacionNeta = t.totalVentas + t.totalCancelaciones + t.totalDevoluciones;
  return t;
};

interface UseTotalesVentasParams {
  referenciaGrid: RefObject<AgGridReact | null>;
  currentType: VentasRouteType;
}

export function useTotalesVentas({ referenciaGrid, currentType }: UseTotalesVentasParams) {
  const [totales, setTotales] = useState<TotalesVentas>(totalesIniciales);

  const recalcularTotalesVisibles = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: FilaVentas[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as FilaVentas);
    });
    setTotales(calcularTotalesVentas(filas, currentType));
  };

  return { totales, recalcularTotalesVisibles };
}
