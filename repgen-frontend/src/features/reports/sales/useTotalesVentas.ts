import type { AgGridReact } from "ag-grid-react";
import type { RefObject } from "react";
import { useState } from "react";
import type { VentasRouteType } from "./ReporteVentas";

export interface TotalesVentas {
  totalVentas: number;
  totalCancelaciones: number;
  totalDevoluciones: number;
  facturacionNeta: number;
  gananciaBruta: number;
  costoDirecto: number;
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
  gananciaBruta: 0,
  costoDirecto: 0,
  facturasVencidas: 0,
  facturasPagadas: 0,
  facturasVigentes: 0,
  facturasCanceladas: 0,
  devoluciones: 0,
};

interface UseTotalesVentasParams {
  referenciaGrid: RefObject<AgGridReact | null>;
  currentType: VentasRouteType;
}

export function useTotalesVentas({
  referenciaGrid,
  currentType,
}: UseTotalesVentasParams) {
  const [totales, setTotales] = useState<TotalesVentas>(totalesIniciales);

  const recalcularTotalesVisibles = () => {
    if (!referenciaGrid.current || !referenciaGrid.current.api) return;
    let totalVentasVisibles = 0;
    let totalCancelacionesVisibles = 0;
    let totalDevolucionesVisibles = 0;
    let totalFacturacionNetaVisibles = 0;
    let gananciaBrutaVisibles = 0;
    let costoDirectoVisibles = 0;
    let facturasVencidas = 0;
    let facturasPagadas = 0;
    let facturasVigentes = 0;
    let facturasCanceladas = 0;
    let devolucionesVisibles = 0;

    if (currentType === "facturas") {
      referenciaGrid.current.api.forEachNodeAfterFilter((node) => {
        if (node.data.facturaGranTotalMxn) {
          totalVentasVisibles +=
            Number(node.data.facturaGranTotalMxn) > 0
              ? Number(node.data.facturaGranTotalMxn)
              : 0;
          totalCancelacionesVisibles +=
            node.data.facturaEstatus === "Cancelada" &&
            Number(node.data.facturaGranTotalMxn) < 0
              ? Number(node.data.facturaGranTotalMxn)
              : 0;
          totalDevolucionesVisibles +=
            node.data.facturaEstatus === "Devolución" &&
            Number(node.data.facturaGranTotalMxn) < 0
              ? Number(node.data.facturaGranTotalMxn)
              : 0;
        }

        facturasVencidas +=
          node.data.facturaEstatus === "Vencida" &&
          Number(node.data.facturaGranTotalMxn) > 0
            ? 1
            : 0;
        facturasPagadas +=
          node.data.facturaEstatus === "Pagada" &&
          Number(node.data.facturaGranTotalMxn) > 0
            ? 1 : 0;
        facturasVigentes +=
          node.data.facturaEstatus === "Vigente" &&
          Number(node.data.facturaGranTotalMxn) > 0
            ? 1
            : 0;
        facturasCanceladas +=
          node.data.facturaEstatus === "Cancelada" &&
          Number(node.data.facturaGranTotalMxn) < 0
            ? 1
            : 0;
        devolucionesVisibles += node.data.facturaEstatus === "Devolución" &&
          Number(node.data.facturaGranTotalMxn) < 0
            ? 1
            : 0;
      });

      totalFacturacionNetaVisibles =
        totalVentasVisibles +
        totalCancelacionesVisibles +
        totalDevolucionesVisibles;
    } else if (currentType === "conceptos") {
      referenciaGrid.current.api.forEachNodeAfterFilter((node) => {
        if (node.data.articuloImporteConDescuentoMxn) {
          const suma =
            Number(node.data.articuloImporteConDescuentoMxn) +
            Number(node.data.articuloIVAMxn) +
            Number(node.data.articuloIEPSMxn) +
            Number(node.data.articuloIVARetenidoMxn) +
            Number(node.data.articuloISRretenidoMxn);
          totalVentasVisibles +=
            Number(node.data.articuloImporteConDescuentoMxn) > 0
              ? suma
              : 0;
          totalCancelacionesVisibles +=
            Number(node.data.articuloImporteConDescuentoMxn) < 0 &&
            node.data.facturaEstatus === "Cancelada"
              ? suma
              : 0;
          totalDevolucionesVisibles +=
            Number(node.data.articuloImporteConDescuentoMxn) < 0 &&
            node.data.facturaEstatus === "Devolución"
              ? suma
              : 0;
          gananciaBrutaVisibles += Number(node.data.gananciaBrutaMxn) || 0;
          costoDirectoVisibles += Number(node.data.costoDirectoSubTotalMxn) || 0;
        }
      });
      totalFacturacionNetaVisibles =
        totalVentasVisibles +
        totalCancelacionesVisibles +
        totalDevolucionesVisibles;
    }
    setTotales({
      totalVentas: totalVentasVisibles,
      totalCancelaciones: totalCancelacionesVisibles,
      totalDevoluciones: totalDevolucionesVisibles,
      facturacionNeta: totalFacturacionNetaVisibles,
      gananciaBruta: gananciaBrutaVisibles,
      costoDirecto: costoDirectoVisibles,
      facturasVencidas: facturasVencidas,
      facturasPagadas: facturasPagadas,
      facturasVigentes: facturasVigentes,
      facturasCanceladas: facturasCanceladas,
      devoluciones: devolucionesVisibles,
    });
  };

  return { totales, recalcularTotalesVisibles };
}
