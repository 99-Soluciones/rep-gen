import { useState } from "react";
import EncabezadoReporte from "../shared/EncabezadoReporte";
import TablaDinamica from "../shared/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../shared/PanelKpiLateral";
import type { ReportBankRecord } from "@repgen/shared-types";
import { columnasBancos } from "./columnas";
import { useReporteBase } from "../shared/useReporteBase";
import { useReporteGrid } from "../shared/useReporteGrid";
import { LineaEstado, NotaRegistros, SeccionEstado } from "../shared/EstadoKpi";
import AccionesTabla from "../shared/AccionesTabla";
import BotonExportar from "../shared/BotonExportar";
import FiltroFechas from "../shared/FiltroFechas";

// Solo MXN, igual que los KPIs: sumar monedas distintas daría una cifra falsa.
// Los saldos no se suman (son acumulados por renglón).
const totalesBancos = {
  campos: ["abono", "cargo"],
  incluirFila: (fila: ReportBankRecord) => fila.moneda === "MXN",
  etiqueta: "Total MXN",
};

const onErrorReporte = (error: unknown) => {
  console.error("Error al obtener los datos:", error);
};

const ReporteBancos = () => {
  const {
    datos,
    estaCargando,
    error,
    reintentar,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    aplicarRango,
    versionRango,
  } = useReporteBase<ReportBankRecord>({
    endpoint: "bancos/buscar",
    onError: onErrorReporte,
  });

  const [mostrarResumen, setMostrarResumen] = useState(true);
  const {
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
  } = useReporteGrid("bancos", aplicarRango);

  //KPIs
  const [totales, setTotales] = useState({ abonos: 0, cargos: 0, balance: 0, otraMoneda: 0 });

  const recalcularTotales = () => {
    if (!referenciaGrid.current || !referenciaGrid.current.api) return;

    let tAbonos = 0;
    let tCargos = 0;
    let otraMoneda = 0;

    referenciaGrid.current.api.forEachNodeAfterFilterAndSort((node) => {
      const data = node.data as ReportBankRecord;
      if (data.moneda !== "MXN") {
        otraMoneda += 1; // Solo se suman registros en MXN; los demás se avisan.
        return;
      }
      tAbonos += data.abono || 0;
      tCargos += data.cargo || 0;
    });
    setTotales({
      abonos: tAbonos,
      cargos: tCargos,
      balance: tAbonos - tCargos,
      otraMoneda,
    });
  };

  return (
    <div className="flex flex-col xl:h-full">
      <EncabezadoReporte
        titulo="Reporte de Bancos"
      />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        <div className="flex-1 min-w-0 flex flex-col">
          <TablaDinamica<ReportBankRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={columnasBancos}
            estaCargando={estaCargando}
            error={error}
            onReintentar={reintentar}
            totales={totalesBancos}
            onGridListo={onGridListo}
            onCambioVista={onCambioVista}
            onActualizacionModulo={() => {
              recalcularTotales();
              actualizarFilasVisibles();
            }}
            filasVisibles={filasVisibles}
            accionesToolbarInicio={
              <FiltroFechas
                // Una vista con periodo cambia las fechas: el borrador se reinicia.
                key={versionRango}
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
                reportId="bancos"
                configs={configs}
                onConfigsChange={refreshConfigs}
                rango={{ desde: fechaDesde, hasta: fechaHasta }}
                onAplicarRango={aplicarRango}
                vistaActual={vistaActual}
                vistaBase={vistaBase}
                onVistaAplicada={(id) => fijarBase(id)}
              />
            }
            accionesToolbarFin={
              <BotonExportar
                referenciaGrid={referenciaGrid}
                nombreArchivo={`reporte_bancos_${fechaDesde}_a_${fechaHasta}`}
                motivoDeshabilitado={
                  estaCargando
                    ? "Espera a que terminen de cargar los registros"
                    : error
                      ? "No hay registros cargados que exportar"
                      : filasVisibles === 0
                        ? "No hay registros que exportar con estas fechas y filtros"
                        : null
                }
              />
            }
          />
        </div>

        <PanelKpiLateral
          titulo="Resumen"
          aviso={
            totales.otraMoneda > 0
              ? `Solo MXN · ${totales.otraMoneda.toLocaleString("es-MX")} ${
                  totales.otraMoneda === 1 ? "movimiento" : "movimientos"
                } en otra moneda sin sumar`
              : "Solo transacciones en MXN"
          }
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-bancos"
          lado="derecha"
          estado={error ? "error" : estaCargando ? "cargando" : null}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
            <NotaRegistros
              registros={filasVisibles}
              filtrado={filasVisibles !== datos.length}
            />
            <SeccionEstado titulo="Movimientos">
              <LineaEstado etiqueta="Abonos" valor={totales.abonos} />
              <LineaEstado etiqueta="Cargos" valor={-totales.cargos} />
              <LineaEstado etiqueta="Flujo neto" valor={totales.balance} total />
            </SeccionEstado>
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteBancos;
