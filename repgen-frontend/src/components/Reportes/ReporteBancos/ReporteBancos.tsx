import { useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import type { Column, GridReadyEvent } from "ag-grid-community";
import EncabezadoReporte from "../../../shared/ui/EncabezadoReporte/EncabezadoReporte";
import TablaDinamica from "../../../shared/ui/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../../../shared/ui/PanelKpiLateral/PanelKpiLateral";
import type { IBancoData } from "../../../features/reports/banks/model";
import { columnasBancos } from "../../../config/ag-grid/Reportes/bancos/bancos.columas";
import { useReporteBase } from "../../../shared/hooks/useReporteBase";
import { useReportConfigs } from "../../../shared/hooks/useReportConfigs";
import CardsKpi from "../PanelKpiLateral/CardsKpi";
import AccionesTabla from "../Filtros/AccionesTabla";
import BotonExportar from "../Filtros/BotonExportar";
import FiltroFechas from "../Filtros/FiltroFechas";

ModuleRegistry.registerModules([AllCommunityModule]);

const onErrorReporte = (error: unknown) => {
  console.error("Error al obtener los datos:", error);
};

const ReporteBancos = () => {
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
  } = useReporteBase<IBancoData>({
    endpoint: "bancos/buscar",
    onError: onErrorReporte,
  });

  const [mostrarResumen, setMostrarResumen] = useState(true);
  const [columnasVisibles, setColumnasVisibles] = useState<Column[]>([]);

  const {
    configs,
    defaultConfig,
    refresh: refreshConfigs,
  } = useReportConfigs("bancos");
  const gridReadyRef = useRef<GridReadyEvent | null>(null);
  const defaultAppliedRef = useRef(false);

  //KPIs
  const [totales, setTotales] = useState({ abonos: 0, cargos: 0, balance: 0 });
  const [filasVisibles, setFilasVisibles] = useState(0);

  const referenciaGrid = useRef<AgGridReact>(null);

  const actualizarFilasVisibles = () => {
    const api = referenciaGrid.current?.api;
    if (api) {
      setFilasVisibles(api.getDisplayedRowCount());
    }
  };

  const recalcularTotales = () => {
    if (!referenciaGrid.current || !referenciaGrid.current.api) return;

    let tAbonos = 0;
    let tCargos = 0;

    referenciaGrid.current.api.forEachNodeAfterFilterAndSort((node) => {
      const data = node.data as IBancoData;
      if (data.moneda !== "MXN") return; // Solo considerar registros en MXN
      tAbonos += data.abono || 0;
      tCargos += data.cargo || 0;
    });
    setTotales({
      abonos: tAbonos,
      cargos: tCargos,
      balance: tAbonos - tCargos,
    });
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

  return (
    <div className="flex flex-col">
      <EncabezadoReporte
        titulo="Reporte de Bancos"
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
          <TablaDinamica<IBancoData>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={columnasBancos}
            estaCargando={estaCargando}
            onGridListo={(params) => {
              gridReadyRef.current = params;
              setColumnasVisibles(params.api.getColumns() || []);
            }}
            onActualizacionModulo={() => {
              recalcularTotales();
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
                reportId="bancos"
                configs={configs}
                onConfigsChange={refreshConfigs}
              />
            }
            accionesToolbarFin={
              <BotonExportar
                referenciaGrid={referenciaGrid}
                nombreArchivo="reporte_bancos"
              />
            }
          />
        </div>

        <PanelKpiLateral
          titulo="Dashboard de metricas"
          aviso="Solo se consideran las transacciones en MXN"
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-bancos"
          lado="derecha"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            <CardsKpi
              titulo="Total Abonos"
              valor={{ cantidad: totales.abonos, tipo: "moneda" }}
              color={{ positivo: "green", negativo: "red" }}
              icono={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              }
            />

            <CardsKpi
              titulo="Total Cargos"
              valor={{ cantidad: totales.cargos, tipo: "moneda" }}
              color={{ positivo: "red", negativo: "red" }}
              icono={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              }
            />

            <CardsKpi
              titulo="Flujo Neto"
              valor={{ cantidad: totales.balance, tipo: "moneda" }}
              color={{ positivo: "blue", negativo: "orange" }}
              icono={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              }
            />
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteBancos;
