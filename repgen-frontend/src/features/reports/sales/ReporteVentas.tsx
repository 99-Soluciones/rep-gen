import { useState } from "react";
import { useParams } from "react-router-dom";
import { construirColumnasVentas } from "./columnas";
import { useColumnLabels } from "../shared/column-labels/useColumnLabels";
import EncabezadoReporte from "../shared/EncabezadoReporte";
import TablaDinamica from "../shared/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../shared/PanelKpiLateral";
import type { ReportSalesItemRecord } from "@repgen/shared-types";
import TabsVentas from "./TabsVentas";
import { useReporteBase } from "../shared/useReporteBase";
import { useReporteGrid } from "../shared/useReporteGrid";
import { toolbarReporte } from "../shared/toolbarReporte";
import { useTotalesVentas } from "./useTotalesVentas";
import KpiPanelVentas from "./KpiPanelVentas";

export type VentasRouteType = "facturas" | "conceptos";

const normalizeReportType = (value: string | undefined): VentasRouteType =>
  value === "conceptos" ? "conceptos" : "facturas";

// Solo importes en MXN y del nivel del renglón: en Conceptos los montos de la
// factura se repiten por artículo y sumarlos los duplicaría.
const camposTotales: Record<VentasRouteType, string[]> = {
  facturas: [
    "facturaGranTotalMxn",
    "pagoGranTotalMxn",
    "importeSinDescuentoMxn",
    "descuentoMontoMxn",
    "importeConDescuentoMxn",
    "ivaMxn",
    "iepsMxn",
    "ivaRetenidoMxn",
    "isrRetenidoMxn",
  ],
  conceptos: [
    "articuloImporteSinDescuentoMxn",
    "articuloDescuentoMontoMxn",
    "articuloImporteConDescuentoMxn",
    "articuloIVAMxn",
    "articuloIEPSMxn",
    "articuloIVARetenidoMxn",
    "articuloISRretenidoMxn",
    "costoDirectoSubTotalMxn",
    "gananciaBrutaMxn",
  ],
};

const onErrorReporte = (error: unknown) => {
  console.error("Error cargando reporte de ventas:", error);
};

const ReporteVentas = ({ reportType }: { reportType?: VentasRouteType }) => {
  const params = useParams<{ reportType?: string }>();
  const currentType = normalizeReportType(reportType ?? params.reportType);
  const { getLabel } = useColumnLabels();

  const schemaReportType = currentType === "facturas" ? "factura" : "conceptos";

  const reportConfig = {
    endpoint:
      currentType === "facturas"
        ? "ventas/buscar"
        : "ventas-por-concepto/buscar",
    nombreArchivo:
      currentType === "facturas"
        ? "reporte_ventas_facturas"
        : "reporte_ventas_conceptos",
  };

  const columnasReportes = construirColumnasVentas(schemaReportType, getLabel);

  const base = useReporteBase<ReportSalesItemRecord>({
    endpoint: reportConfig.endpoint,
    onError: onErrorReporte,
  });
  const { datos, estaCargando, error, reintentar, aplicarRango } = base;

  const [mostrarResumen, setMostrarResumen] = useState(true);

  const reportId =
    currentType === "facturas" ? "ventas_facturas" : "ventas_conceptos";
  const grid = useReporteGrid(reportId, aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;

  const { totales, recalcularTotalesVisibles } = useTotalesVentas({
    referenciaGrid,
    currentType,
  });

  return (
    <div className="flex flex-col w-full xl:h-full">
      <EncabezadoReporte
        titulo="Reporte de Ventas"
        encabezadoExtra={<TabsVentas reportType={currentType} />}
      />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        <div className="flex-1 min-w-0 flex flex-col">
          <TablaDinamica<ReportSalesItemRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={columnasReportes}
            estaCargando={estaCargando}
            error={error}
            onReintentar={reintentar}
            totales={{ campos: camposTotales[currentType] }}
            onGridListo={onGridListo}
            onCambioVista={onCambioVista}
            onActualizacionModulo={() => {
              recalcularTotalesVisibles();
              actualizarFilasVisibles();
            }}
            filasVisibles={filasVisibles}
            {...toolbarReporte({
              base,
              grid,
              reportId,
              nombreArchivo: reportConfig.nombreArchivo,
            })}
          />
        </div>

        <PanelKpiLateral
          aviso="Importes en MXN"
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-ventas"
          estado={error ? "error" : estaCargando ? "cargando" : null}
        >
          <KpiPanelVentas
            totales={totales}
            currentType={currentType}
            registros={filasVisibles}
            filtrado={filasVisibles !== datos.length}
          />
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteVentas;
