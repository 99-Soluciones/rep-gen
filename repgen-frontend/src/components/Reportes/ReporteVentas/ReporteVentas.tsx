import { useState, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { useParams } from "react-router-dom";
import { construirColumnasVentas } from "../../../config/ag-grid/Reportes/ventas/ventas.columnas";
import { useColumnLabels } from "../../../features/reports/shared/context/useColumnLabels";
import EncabezadoReporte from "../../../shared/ui/EncabezadoReporte/EncabezadoReporte";
import TablaDinamica from "../../../shared/ui/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../../../shared/ui/PanelKpiLateral/PanelKpiLateral";
import type { IVentaData } from "../../../features/reports/sales/model";
import {
  AllCommunityModule,
  ModuleRegistry,
  type Column,
  type GridReadyEvent,
} from "ag-grid-community";
import TabsVentas from "./TabsVentas";
import { useReporteBase } from "../../../shared/hooks/useReporteBase";
import { useReportConfigs } from "../../../shared/hooks/useReportConfigs";
import AccionesTabla from "../Filtros/AccionesTabla";
import BotonExportar from "../Filtros/BotonExportar";
import FiltroFechas from "../Filtros/FiltroFechas";
import { useTotalesVentas } from "./useTotalesVentas";
import KpiPanelVentas from "./KpiPanelVentas";

ModuleRegistry.registerModules([AllCommunityModule]);

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
    textoBusqueda,
    setTextoBusqueda,
    setBusquedaActiva,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    modeloFiltros,
    setModeloFiltros,
    setPaginaActual,
  } = useReporteBase<IVentaData>({
    endpoint: reportConfig.endpoint,
    onError: onErrorReporte,
  });

  const [mostrarResumen, setMostrarResumen] = useState(true);
  const [columnasVisibles, setColumnasVisibles] = useState<Column[]>([]);
  const [filasVisibles, setFilasVisibles] = useState(0);

  const reportId =
    currentType === "facturas" ? "ventas_facturas" : "ventas_conceptos";
  const {
    configs,
    defaultConfig,
    refresh: refreshConfigs,
  } = useReportConfigs(reportId);
  const gridReadyRef = useRef<GridReadyEvent | null>(null);
  const defaultAppliedRef = useRef(false);

  const referenciaGrid = useRef<AgGridReact>(null);

  const { totales, recalcularTotalesVisibles } = useTotalesVentas({
    referenciaGrid,
    currentType,
  });

  const actualizarFilasVisibles = () => {
    const api = referenciaGrid.current?.api;
    if (api) {
      setFilasVisibles(api.getDisplayedRowCount());
    }
  };

  // Aplica la config predeterminada cuando el grid y la config estén listos
  useEffect(() => {
    if (defaultAppliedRef.current || !gridReadyRef.current || !defaultConfig)
      return;
    gridReadyRef.current.api.applyColumnState({
      state: defaultConfig.columnState,
      applyOrder: true,
    });
    setColumnasVisibles(gridReadyRef.current.api.getColumns() ?? []);
    defaultAppliedRef.current = true;
  }, [defaultConfig]);

  const esPrimerCambioTipoRef = useRef(true);

  // La paginación/búsqueda/filtros se reinician dentro de useReporteBase al
  // cambiar el endpoint (facturas <-> conceptos); aquí solo queda la llamada
  // imperativa a la API de ag-grid en un efecto real.
  useEffect(() => {
    if (esPrimerCambioTipoRef.current) {
      esPrimerCambioTipoRef.current = false;
    } else {
      // Al cambiar de tipo, permitir que se aplique la nueva config predeterminada
      defaultAppliedRef.current = false;
      if (referenciaGrid.current?.api) {
        referenciaGrid.current.api.setFilterModel(null);
      }
    }
    if (referenciaGrid.current?.api) {
      setColumnasVisibles(referenciaGrid.current.api.getColumns() || []);
    }
  }, [currentType]);

  return (
    <div className="flex flex-col w-full">
      <EncabezadoReporte
        titulo="Reporte de Ventas"
        encabezadoExtra={<TabsVentas reportType={currentType} />}
        referenciaGrid={referenciaGrid}
        textoBusqueda={textoBusqueda}
        setTextoBusqueda={setTextoBusqueda}
        setBusquedaActiva={setBusquedaActiva}
        modeloFiltros={modeloFiltros}
        setModeloFiltros={setModeloFiltros}
        setPaginaActual={setPaginaActual}
      />

      <div className="flex flex-col xl:flex-row gap-2">
        <div className="flex-1 min-w-0">
          <TablaDinamica<IVentaData>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={columnasReportes}
            estaCargando={estaCargando}
            onGridListo={(params) => {
              gridReadyRef.current = params;
              setColumnasVisibles(params.api.getColumns() || []);
            }}
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
                setPaginaActual={setPaginaActual}
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
