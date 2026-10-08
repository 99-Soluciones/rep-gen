import { useEffect, useRef, useState, type RefObject } from "react";
import type { AgGridReact } from "ag-grid-react";
import type { Column, GridApi, GridReadyEvent } from "ag-grid-community";
import type { ReportConfigResponse } from "./api/report-configs.api";
import { useReportConfigs } from "./useReportConfigs";

// Función de módulo (no closure del hook) para que React Compiler no necesite
// estabilizarla: el efecto y onGridListo la llaman con lo que tengan a mano.
function aplicarVistaPredeterminada(
  api: GridApi | undefined,
  vista: ReportConfigResponse | null,
  reportId: string,
  aplicadaParaRef: RefObject<string | null>,
): Column[] | null {
  // Mientras cargan las vistas del reporte nuevo, `vista` aún puede ser la del anterior.
  if (!api || !vista || vista.reportId !== reportId) return null;
  if (aplicadaParaRef.current === reportId) return null;
  api.applyColumnState({ state: vista.columnState, applyOrder: true });
  aplicadaParaRef.current = reportId;
  return api.getColumns() ?? [];
}

/**
 * Estado del grid común a las pantallas de reporte: referencia al grid,
 * columnas visibles, contador de filas y vistas guardadas. La vista
 * predeterminada se aplica una vez por reporte, en cuanto el grid y las
 * vistas están listos (en cualquier orden).
 */
export const useReporteGrid = (reportId: string) => {
  const referenciaGrid = useRef<AgGridReact>(null);
  const [columnasVisibles, setColumnasVisibles] = useState<Column[]>([]);
  const [filasVisibles, setFilasVisibles] = useState(0);
  const { configs, defaultConfig, refresh: refreshConfigs } =
    useReportConfigs(reportId);
  const vistaAplicadaParaRef = useRef<string | null>(null);
  const reportIdAnteriorRef = useRef(reportId);

  useEffect(() => {
    const columnas = aplicarVistaPredeterminada(
      referenciaGrid.current?.api,
      defaultConfig,
      reportId,
      vistaAplicadaParaRef,
    );
    if (columnas) setColumnasVisibles(columnas);
  }, [defaultConfig, reportId]);

  // Al cambiar de reporte en la misma pantalla (facturas <-> conceptos) los
  // filtros de columna anteriores ya no aplican.
  useEffect(() => {
    if (reportIdAnteriorRef.current === reportId) return;
    reportIdAnteriorRef.current = reportId;
    const api = referenciaGrid.current?.api;
    if (!api) return;
    api.setFilterModel(null);
    setColumnasVisibles(api.getColumns() ?? []);
  }, [reportId]);

  const onGridListo = (event: GridReadyEvent) => {
    const columnas = aplicarVistaPredeterminada(
      event.api,
      defaultConfig,
      reportId,
      vistaAplicadaParaRef,
    );
    setColumnasVisibles(columnas ?? event.api.getColumns() ?? []);
  };

  const actualizarFilasVisibles = () => {
    const api = referenciaGrid.current?.api;
    if (api) {
      setFilasVisibles(api.getDisplayedRowCount());
    }
  };

  return {
    referenciaGrid,
    columnasVisibles,
    setColumnasVisibles,
    filasVisibles,
    actualizarFilasVisibles,
    onGridListo,
    configs,
    refreshConfigs,
  };
};
