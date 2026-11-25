import { useState } from "react";
import type { ReportPayablesRecord } from "@repgen/shared-types";

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
import { agruparPorSeccion } from "../shared/ag-grid/agruparPorSeccion";
import {
  LineaEstado,
  ResultadoCompacto,
  ResultadoResumen,
  SeccionEstado,
} from "../shared/EstadoKpi";
import { formatearFecha, obtenerFechaHoyFormateada } from "../../../shared/utils/fechas";
import { construirColumnasCxp } from "./columnas";
import { calcularTotalesCxp, type TotalesCxp } from "./calcularCxp";

const totalesTabla = {
  campos: [
    "facturaSaldoPendiente",
    "facturaSaldoVencido",
    "facturaSaldoPorVencer",
    "facturaNoPagarMonto",
    "cargoSaldoNoAplicado",
    "abonoSaldoNoAplicado",
    "cargoMontoSinIdentificar",
  ],
  etiqueta: "Total",
};

const columnas = agruparPorSeccion(construirColumnasCxp());

/** Cuentas por pagar al día de corte. Ficha: docs/reports/fichas/payables/payables.md */
const ReporteCuentasPorPagar = () => {
  const base = useReporteCorte<ReportPayablesRecord>({
    endpoint: "cuentas-por-pagar/buscar",
  });
  const { datos, estaCargando, error, reintentar, fechaCorte, setFechaCorte } = base;
  const hoy = obtenerFechaHoyFormateada();
  // Una vista con periodo fija un rango: su último día es el corte.
  const aplicarRango = (_desde: string, hasta: string) =>
    setFechaCorte(hasta > hoy ? hoy : hasta);

  const grid = useReporteGrid("cuentas_por_pagar", aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;
  const [mostrarResumen, setMostrarResumen] = usePreferenciaLocal("kpi-panel-cxp-abierto", true);
  const [totales, setTotales] = useState<TotalesCxp>(() => calcularTotalesCxp([]));

  const recalcularTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: ReportPayablesRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as ReportPayablesRecord);
    });
    setTotales(calcularTotalesCxp(filas));
  };

  const filtrado = filasVisibles !== datos.length;
  const estado = estadoCifras(error, estaCargando, base.cargadoEn);

  return (
    <div className="flex flex-col xl:h-full">
      <EncabezadoReporte titulo="Cuentas por pagar" tituloPagina="Cuentas por pagar" />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        <div className="flex-none min-w-0 flex flex-col min-h-[100cqh] xl:flex-1 xl:min-h-0">
          <ResultadoCompacto
            etiqueta="Saldo pendiente"
            filtrado={filtrado}
            valor={totales.pendiente}
            estado={estado}
            onAbrirResumen={() => setMostrarResumen(true)}
          />
          <TablaDinamica<ReportPayablesRecord>
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
                reportId="cuentas_por_pagar"
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
                nombreArchivo={`cuentas_por_pagar_al_${fechaCorte}`}
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
          storageKey="kpi-panel-cxp"
          estado={estado}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
            <ResultadoResumen etiqueta="Saldo pendiente" valor={totales.pendiente} filtrado={filtrado} />
            <SeccionEstado titulo="Facturas">
              <LineaEstado etiqueta="Vencido" valor={totales.vencido} />
              <LineaEstado etiqueta="Por vencer" valor={totales.porVencer} />
              <LineaEstado etiqueta="Saldo pendiente" valor={totales.pendiente} total />
              {totales.noPagar !== 0 && (
                <LineaEstado etiqueta="No pagar (aparte)" valor={totales.noPagar} />
              )}
            </SeccionEstado>
            <SeccionEstado
              titulo="Antigüedad del vencido"
              nota="Días desde la fecha límite de pago hasta el corte."
            >
              <LineaEstado etiqueta="1 a 30 días" valor={totales.antiguedad.d1a30} />
              <LineaEstado etiqueta="31 a 60 días" valor={totales.antiguedad.d31a60} />
              <LineaEstado etiqueta="61 a 90 días" valor={totales.antiguedad.d61a90} />
              <LineaEstado etiqueta="Más de 90 días" valor={totales.antiguedad.mas90} />
            </SeccionEstado>
            <SeccionEstado titulo="Bancos">
              <LineaEstado etiqueta="Pagos por aplicar" valor={totales.cargosNoAplicados} />
              <LineaEstado etiqueta="Devoluciones por aplicar" valor={totales.abonosNoAplicados} />
              <LineaEstado etiqueta="Cargos sin identificar" valor={totales.sinIdentificar} />
            </SeccionEstado>
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteCuentasPorPagar;
