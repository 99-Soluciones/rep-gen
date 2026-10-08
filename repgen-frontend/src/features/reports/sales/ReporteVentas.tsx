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
import AccionesTabla from "../shared/AccionesTabla";
import BotonExportar from "../shared/BotonExportar";
import FiltroFechas from "../shared/FiltroFechas";
import { useTotalesVentas } from "./useTotalesVentas";
import KpiPanelVentas from "./KpiPanelVentas";

export type VentasRouteType = "facturas" | "conceptos";

const normalizeReportType = (value: string | undefined): VentasRouteType =>
  value === "conceptos" ? "conceptos" : "facturas";

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

  const {
    datos,
    estaCargando,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
  } = useReporteBase<ReportSalesItemRecord>({
    endpoint: reportConfig.endpoint,
    onError: onErrorReporte,
  });

  const [mostrarResumen, setMostrarResumen] = useState(true);

  const reportId =
    currentType === "facturas" ? "ventas_facturas" : "ventas_conceptos";
  const {
    referenciaGrid,
    columnasVisibles,
    setColumnasVisibles,
    filasVisibles,
    actualizarFilasVisibles,
    onGridListo,
    configs,
    refreshConfigs,
  } = useReporteGrid(reportId);

  const { totales, recalcularTotalesVisibles } = useTotalesVentas({
    referenciaGrid,
    currentType,
  });

  return (
    <div className="flex flex-col w-full">
      <EncabezadoReporte
        titulo="Reporte de Ventas"
        encabezadoExtra={<TabsVentas reportType={currentType} />}
      />

      <div className="flex flex-col xl:flex-row gap-2">
        <div className="flex-1 min-w-0">
          <TablaDinamica<ReportSalesItemRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={columnasReportes}
            estaCargando={estaCargando}
            onGridListo={onGridListo}
            onActualizacionModulo={() => {
              recalcularTotalesVisibles();
              actualizarFilasVisibles();
            }}
            filasVisibles={filasVisibles}
            accionesToolbarInicio={
              <FiltroFechas
                fechaDesde={fechaDesde}
                setFechaDesde={setFechaDesde}
                fechaHasta={fechaHasta}
                setFechaHasta={setFechaHasta}
              />
            }
            accionesToolbar={
              <AccionesTabla
                referenciaGrid={referenciaGrid}
                columnasVisibles={columnasVisibles}
                setColumnasVisibles={setColumnasVisibles}
                reportId={reportId}
                configs={configs}
                onConfigsChange={refreshConfigs}
              />
            }
            accionesToolbarFin={
              <BotonExportar
                referenciaGrid={referenciaGrid}
                nombreArchivo={reportConfig.nombreArchivo}
              />
            }
          />
        </div>

        <PanelKpiLateral
          titulo="Dashboard de metricas"
          aviso="En MXN"
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-ventas"
          lado="derecha"
        >
          <KpiPanelVentas totales={totales} currentType={currentType} />
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteVentas;
