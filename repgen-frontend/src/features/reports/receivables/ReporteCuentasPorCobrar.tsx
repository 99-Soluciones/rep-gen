import { useState } from "react";
import type { ReportReceivablesRecord } from "@repgen/shared-types";

import EncabezadoReporte from "../shared/EncabezadoReporte";
import TablaDinamica from "../shared/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../shared/PanelKpiLateral";
import AccionesTabla from "../shared/AccionesTabla";
import ActualizarDatos from "../shared/ActualizarDatos";
import BotonExportar from "../shared/BotonExportar";
import SelectorCorte from "../shared/SelectorCorte";
import { estadoCifras } from "../shared/estadoCifras";
import { useReporteCorte } from "../shared/useReporteCorte";
import { useReporteGrid } from "../shared/useReporteGrid";
import { usePreferenciaLocal } from "../shared/usePreferenciaLocal";
import { useColumnLabels } from "../shared/column-labels/useColumnLabels";
import {
  LineaEstado,
  ResultadoCompacto,
  ResultadoResumen,
  SeccionEstado,
} from "../shared/EstadoKpi";
import { formatearFecha, obtenerFechaHoyFormateada } from "../../../shared/utils/fechas";
import { agruparPorSeccion } from "../shared/ag-grid/agruparPorSeccion";
import { construirColumnasCxc } from "./columnas";
import { calcularTotalesCxc, type TotalesCxc } from "./calcularCxc";

const totalesTabla = {
  campos: [
    "facturaSaldoPendiente",
    "facturaSaldoVencido",
    "facturaSaldoPorVencer",
    "facturaNoCobrarGranTotal",
    "abonoSaldoNoAplicado",
    "cargoSaldoNoAplicado",
    "abonoMontoSinIdentificar",
  ],
  etiqueta: "Total",
};

const ReporteCuentasPorCobrar = () => {
  const base = useReporteCorte<ReportReceivablesRecord>({
    endpoint: "cuentas-por-cobrar/buscar",
  });
  const { datos, estaCargando, error, reintentar, fechaCorte, setFechaCorte } = base;
  const hoy = obtenerFechaHoyFormateada();
  // Una vista con periodo fija un rango: su último día es el corte.
  const aplicarRango = (_desde: string, hasta: string) =>
    setFechaCorte(hasta > hoy ? hoy : hasta);

  const { getLabel } = useColumnLabels();
  const columnas = agruparPorSeccion(construirColumnasCxc(getLabel));
  const grid = useReporteGrid("cuentas_por_cobrar", aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;
  const [mostrarResumen, setMostrarResumen] = usePreferenciaLocal("kpi-panel-cxc-abierto", true);
  const [totales, setTotales] = useState<TotalesCxc>(() => calcularTotalesCxc([]));

  const recalcularTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: ReportReceivablesRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as ReportReceivablesRecord);
    });
    setTotales(calcularTotalesCxc(filas));
  };

  const filtrado = filasVisibles !== datos.length;
  const estado = estadoCifras(error, estaCargando, base.cargadoEn);

  return (
    <div className="flex flex-col xl:h-full">
      <EncabezadoReporte titulo="Cuentas por cobrar" tituloPagina="Cuentas por cobrar" />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        <div className="flex-none min-w-0 flex flex-col min-h-[100cqh] xl:flex-1 xl:min-h-0">
          <ResultadoCompacto
            etiqueta="Saldo pendiente"
            filtrado={filtrado}
            valor={totales.pendiente}
            estado={estado}
            onAbrirResumen={() => setMostrarResumen(true)}
          />
          <TablaDinamica<ReportReceivablesRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={columnas}
            estaCargando={estaCargando}
            error={error}
            onReintentar={reintentar}
            totales={totalesTabla}
            onGridListo={onGridListo}
            onCambioVista={onCambioVista}
            onActualizacionModulo={() => {
              recalcularTotales();
              actualizarFilasVisibles();
            }}
            filasVisibles={filasVisibles}
            accionesToolbarInicio={
              <>
                {/* key: si el corte cambia desde fuera (una vista), el borrador se reinicia. */}
                <SelectorCorte
                  key={fechaCorte}
                  fechaCorte={fechaCorte}
                  hoy={hoy}
                  onAplicar={setFechaCorte}
                />
                {!error && (
                  <ActualizarDatos
                    cargadoEn={base.cargadoEn}
                    estaCargando={estaCargando}
                    onActualizar={reintentar}
                  />
                )}
              </>
            }
            accionesToolbar={
              <AccionesTabla
                referenciaGrid={referenciaGrid}
                columnasVisibles={grid.columnasVisibles}
                setColumnasVisibles={grid.setColumnasVisibles}
                reportId="cuentas_por_cobrar"
                configs={grid.configs}
                onConfigsChange={grid.refreshConfigs}
                rango={{ desde: fechaCorte, hasta: fechaCorte }}
                onAplicarRango={aplicarRango}
                vistaActual={grid.vistaActual}
                vistaBase={grid.vistaBase}
                onVistaAplicada={(id) => grid.fijarBase(id)}
                vistaElegida={grid.vistaElegida}
                onElegirVista={grid.elegirVista}
              />
            }
            accionesToolbarFin={
              <BotonExportar
                referenciaGrid={referenciaGrid}
                nombreArchivo={`cuentas_por_cobrar_al_${fechaCorte}`}
                motivoDeshabilitado={
                  estaCargando
                    ? "Espera a que terminen de cargar los registros"
                    : error
                      ? "No hay registros cargados que exportar"
                      : filasVisibles === 0
                        ? "No hay registros que exportar con este corte y filtros"
                        : null
                }
              />
            }
          />
        </div>

        <PanelKpiLateral
          aviso={`Saldos al cierre del ${formatearFecha(fechaCorte)} · MXN`}
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-cxc"
          estado={estado}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
            <ResultadoResumen etiqueta="Saldo pendiente" valor={totales.pendiente} filtrado={filtrado} />
            <SeccionEstado titulo="Facturas">
              <LineaEstado etiqueta="Vencido" valor={totales.vencido} />
              <LineaEstado etiqueta="Por vencer" valor={totales.porVencer} />
              <LineaEstado etiqueta="Saldo pendiente" valor={totales.pendiente} total />
              {totales.noCobrar !== 0 && (
                <LineaEstado etiqueta="No cobrar (aparte)" valor={totales.noCobrar} />
              )}
            </SeccionEstado>
            <SeccionEstado titulo="Antigüedad del vencido" nota="Días desde el vencimiento hasta el corte.">
              <LineaEstado etiqueta="1 a 30 días" valor={totales.antiguedad.d1a30} />
              <LineaEstado etiqueta="31 a 60 días" valor={totales.antiguedad.d31a60} />
              <LineaEstado etiqueta="61 a 90 días" valor={totales.antiguedad.d61a90} />
              <LineaEstado etiqueta="Más de 90 días" valor={totales.antiguedad.mas90} />
            </SeccionEstado>
            <SeccionEstado
              titulo="Bancos"
              nota="Neto = saldo pendiente − abonos no aplicados."
            >
              <LineaEstado etiqueta="Abonos no aplicados" valor={-totales.abonosNoAplicados} />
              <LineaEstado etiqueta="Neto" valor={totales.neto} total />
              <LineaEstado etiqueta="Cargos a favor del cliente" valor={totales.cargosNoAplicados} />
              <LineaEstado etiqueta="Abonos sin identificar" valor={totales.sinIdentificar} />
            </SeccionEstado>
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteCuentasPorCobrar;
