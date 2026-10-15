import { useEffect, useRef, useState, type RefObject } from "react";
import type { AgGridReact } from "ag-grid-react";
import type { Column, GridApi, GridReadyEvent } from "ag-grid-community";
import type { ReportConfigResponse } from "./api/report-configs.api";
import { useReportConfigs } from "./useReportConfigs";
import {
  aplicarVista,
  capturarVista,
  huellaVista,
  resolverPeriodo,
  type VistaCapturada,
} from "./ConfiguracionesColumnas/vista";

/** Estado del grid justo después de abrir o guardar una vista: la referencia de "sin cambios". */
export interface VistaBase {
  configId: string | null;
  huella: string;
}

type AplicarRango = (desde: string, hasta: string) => void;

// Función de módulo (no closure del hook) para que React Compiler no necesite
// estabilizarla: el efecto y onGridListo la llaman con lo que tengan a mano.
function aplicarVistaPredeterminada(
  api: GridApi | undefined,
  vista: ReportConfigResponse | null,
  reportId: string,
  aplicadaEnRef: RefObject<Set<string>>,
  aplicarRango: AplicarRango | undefined,
): Column[] | null {
  // Mientras cargan las vistas del reporte nuevo, `vista` aún puede ser la del anterior.
  if (!api || !vista || vista.reportId !== reportId) return null;
  // Una vez por reporte: al volver a una pestaña manda lo que el usuario dejó ahí.
  if (aplicadaEnRef.current.has(reportId)) return null;
  aplicarVista(api, vista);
  if (vista.periodo && aplicarRango) {
    const { desde, hasta } = resolverPeriodo(vista.periodo);
    aplicarRango(desde, hasta);
  }
  aplicadaEnRef.current.add(reportId);
  return api.getColumns() ?? [];
}

/**
 * Estado del grid común a las pantallas de reporte: referencia al grid,
 * columnas visibles, contador de filas y vistas guardadas. La vista
 * predeterminada (columnas, filtros y periodo) se aplica una vez por reporte,
 * en cuanto el grid y las vistas están listos (en cualquier orden).
 */
export const useReporteGrid = (reportId: string, aplicarRango?: AplicarRango) => {
  const referenciaGrid = useRef<AgGridReact>(null);
  const [columnasVisibles, setColumnasVisibles] = useState<Column[]>([]);
  const [filasVisibles, setFilasVisibles] = useState(0);
  // Foto de columnas + filtros del grid, en estado (no leída del ref en el
  // render): así React Compiler recalcula "• sin guardar" en cada cambio.
  const [vistaActual, setVistaActual] = useState<VistaCapturada | null>(null);
  const [vistaBase, setVistaBase] = useState<VistaBase | null>(null);

  // Tras abrir o guardar una vista, el estado del grid en ese momento es "sin
  // cambios". Se compara grid contra grid (no contra el JSON guardado, que AG
  // Grid puede normalizar distinto) y la foto se toma explícitamente, sin
  // depender de que lleguen los eventos. AG Grid crea los filtros en diferido:
  // se espera una vuelta del event loop.
  const fijarBase = (configId: string | null, api = referenciaGrid.current?.api) => {
    if (!api) return;
    setTimeout(() => {
      if (api.isDestroyed()) return;
      const foto = capturarVista(api);
      setVistaActual(foto);
      setVistaBase({ configId, huella: huellaVista(foto.columnState, foto.filterModel) });
    }, 0);
  };
  const { configs, defaultConfig, refresh: refreshConfigs } =
    useReportConfigs(reportId);
  const vistaAplicadaEnRef = useRef(new Set<string>());
  const reportIdAnteriorRef = useRef(reportId);
  const aplicarRangoRef = useRef(aplicarRango);

  useEffect(() => {
    aplicarRangoRef.current = aplicarRango;
  }, [aplicarRango]);

  // Cada pestaña (facturas / conceptos) recuerda sus columnas y filtros. La foto
  // se guarda en el render del cambio, antes de que el grid reciba las columnas
  // nuevas y descarte filtros (patrón "estado previo" de React, sin efectos).
  const [reportIdMostrado, setReportIdMostrado] = useState(reportId);
  const [vistaPorReporte, setVistaPorReporte] = useState<Record<string, VistaCapturada>>({});
  if (reportIdMostrado !== reportId) {
    setReportIdMostrado(reportId);
    if (vistaActual) setVistaPorReporte({ ...vistaPorReporte, [reportIdMostrado]: vistaActual });
  }

  // Al cambiar de pestaña: lo que el usuario dejó en ella, o sin filtros si es
  // la primera vez (los de la otra pestaña no aplican). Va antes que la vista
  // predeterminada para que, en la primera visita, esta no se borre después.
  useEffect(() => {
    if (reportIdAnteriorRef.current === reportId) return;
    reportIdAnteriorRef.current = reportId;
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const guardada = vistaPorReporte[reportId];
    if (guardada) aplicarVista(api, guardada);
    else api.setFilterModel(null);
    setColumnasVisibles(api.getColumns() ?? []);
  }, [reportId, vistaPorReporte]);

  useEffect(() => {
    const columnas = aplicarVistaPredeterminada(
      referenciaGrid.current?.api,
      defaultConfig,
      reportId,
      vistaAplicadaEnRef,
      aplicarRangoRef.current,
    );
    if (columnas) {
      setColumnasVisibles(columnas);
      fijarBase(defaultConfig?.id ?? null);
    }
  }, [defaultConfig, reportId]);

  const onGridListo = (event: GridReadyEvent) => {
    const columnas = aplicarVistaPredeterminada(
      event.api,
      defaultConfig,
      reportId,
      vistaAplicadaEnRef,
      aplicarRangoRef.current,
    );
    setColumnasVisibles(columnas ?? event.api.getColumns() ?? []);
    // Sin vista predeterminada, el grid recién creado es la referencia de
    // "— Ninguna —": ocultar columnas o filtrar ya cuenta como cambio.
    fijarBase(columnas ? (defaultConfig?.id ?? null) : null, event.api);
    setVistaActual(capturarVista(event.api));
  };

  // Lo llama TablaDinamica (props onFilterChanged, onColumnVisible…) en cada
  // cambio de columnas, orden o filtros: la foto queda en estado para que React
  // Compiler recalcule "cambios sin guardar".
  const onCambioVista = () => {
    const api = referenciaGrid.current?.api;
    if (api && !api.isDestroyed()) setVistaActual(capturarVista(api));
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
    vistaActual,
    vistaBase,
    fijarBase,
    onCambioVista,
  };
};
