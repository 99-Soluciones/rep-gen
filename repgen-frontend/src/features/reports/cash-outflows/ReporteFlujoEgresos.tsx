import { useState } from "react";
import { useParams } from "react-router-dom";
import type { ReportCashOutflowRecord } from "@repgen/shared-types";
import EncabezadoReporte from "../shared/EncabezadoReporte";
import TablaDinamica from "../shared/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../shared/PanelKpiLateral";
import { estadoCifras } from "../shared/estadoCifras";
import { useColumnLabels } from "../shared/column-labels/useColumnLabels";
import { useReporteBase } from "../shared/useReporteBase";
import { useReporteGrid } from "../shared/useReporteGrid";
import { usePreferenciaLocal } from "../shared/usePreferenciaLocal";
import { useComparacionPeriodo } from "../shared/useComparacionPeriodo";
import { toolbarReporte } from "../shared/toolbarReporte";
import {
  LineaEstado,
  NotaRegistros,
  ResultadoCompacto,
  ResultadoResumen,
  SeccionEstado,
} from "../shared/EstadoKpi";
import TabsVentas from "../sales/TabsVentas";
import { construirColumnasEgresos } from "./columnas";
import { calcularTotalesEgresos, totalEgresos, type TotalesEgresos } from "./calcularEgresos";

const RUTA_EGRESOS = "/flujo_efectivo_egresos";

type Pestana = "facturas" | "conceptos";

const VISTAS = {
  facturas: {
    detalle: "factura",
    endpoint: "flujo-efectivo-egresos/buscar",
    reportId: "flujo_efectivo_egresos_facturas",
    nombreArchivo: "reporte_egresos_facturas",
    titulo: "Facturas",
  },
  conceptos: {
    detalle: "concepto",
    endpoint: "flujo-efectivo-egresos-por-concepto/buscar",
    reportId: "flujo_efectivo_egresos_conceptos",
    nombreArchivo: "reporte_egresos_conceptos",
    titulo: "Conceptos",
  },
} as const;

// Todos son importes del renglón ya prorrateados, así que se pueden sumar en
// las dos vistas. El gran total de la factura no: se repite en cada pago.
const totalesTabla = {
  campos: [
    "pagoGranTotalMxn",
    "importeSinDescuentoMxn",
    "descuentoMontoMxn",
    "importeConDescuentoMxn",
    "ivaMxn",
    "iepsMxn",
    "ivaRetenidoMxn",
    "isrRetenidoMxn",
  ],
  etiqueta: "Total MXN",
};

const SIN_TOTALES: TotalesEgresos = {
  total: 0,
  aplicado: 0,
  sinAplicar: 0,
  noIdentificado: 0,
  traspasos: 0,
  porBanco: [],
};

const onErrorReporte = (error: unknown) => {
  console.error("Error cargando reporte de egresos:", error);
};

const ReporteFlujoEgresos = () => {
  const params = useParams<{ reportType?: string }>();
  const pestana: Pestana = params.reportType === "conceptos" ? "conceptos" : "facturas";
  const vista = VISTAS[pestana];
  const { getLabel } = useColumnLabels();

  const base = useReporteBase<ReportCashOutflowRecord>({
    endpoint: vista.endpoint,
    onError: onErrorReporte,
  });
  const { datos, estaCargando, error, reintentar, aplicarRango } = base;

  const [mostrarResumen, setMostrarResumen] = usePreferenciaLocal("kpi-panel-egresos-abierto", true);
  const grid = useReporteGrid(vista.reportId, aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;

  // El resumen se calcula sobre las filas que dejan los filtros de la tabla.
  const [totales, setTotales] = useState<TotalesEgresos>(SIN_TOTALES);
  const recalcularTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: ReportCashOutflowRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as ReportCashOutflowRecord);
    });
    setTotales(calcularTotalesEgresos(filas));
  };

  const filtrado = filasVisibles !== datos.length;
  const estado = estadoCifras(error, estaCargando, base.cargadoEn);
  const comparacion = useComparacionPeriodo<ReportCashOutflowRecord>({
    endpoint: vista.endpoint,
    desde: base.fechaDesde,
    hasta: base.fechaHasta,
    calcular: totalEgresos,
    intento: base.intento,
  });

  return (
    <div className="flex flex-col w-full xl:h-full">
      <EncabezadoReporte
        titulo="Flujo de efectivo - Egresos"
        tituloPagina={`Egresos · ${vista.titulo}`}
        encabezadoExtra={<TabsVentas reportType={pestana} rutaBase={RUTA_EGRESOS} />}
      />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        {/* Mismo reparto de alto que Bancos y Ventas (ver ReporteBancos). */}
        <div className="flex-none min-w-0 flex flex-col min-h-[100cqh] xl:flex-1 xl:min-h-0">
          <ResultadoCompacto
            etiqueta="Egresos del periodo"
            filtrado={filtrado}
            valor={totales.total}
            estado={estado}
            onAbrirResumen={() => setMostrarResumen(true)}
          />
          <TablaDinamica<ReportCashOutflowRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={construirColumnasEgresos(vista.detalle, getLabel)}
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
            {...toolbarReporte({
              base,
              grid,
              reportId: vista.reportId,
              nombreArchivo: vista.nombreArchivo,
            })}
          />
        </div>

        <PanelKpiLateral
          aviso="Importes en MXN"
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-egresos"
          estado={estado}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
            <ResultadoResumen
              etiqueta="Egresos del periodo"
              valor={totales.total}
              comparacion={comparacion}
              filtrado={filtrado}
            />
            <NotaRegistros
              registros={filasVisibles}
              total={datos.length}
              desde={base.fechaDesde}
              hasta={base.fechaHasta}
            />
            <SeccionEstado
              titulo="Por tipo"
              nota="Todo cuenta en la fecha en que salió del banco, aunque el complemento de pago sea posterior."
            >
              <LineaEstado etiqueta="Aplicado a facturas" valor={totales.aplicado} />
              <LineaEstado etiqueta="Sin aplicar (con proveedor)" valor={totales.sinAplicar} />
              <LineaEstado etiqueta="No identificado" valor={totales.noIdentificado} />
              <LineaEstado etiqueta="Traspasos entre cuentas" valor={totales.traspasos} />
              <LineaEstado etiqueta="Total" valor={totales.total} total />
            </SeccionEstado>
            {totales.porBanco.length > 0 && (
              <SeccionEstado titulo="Por banco">
                {totales.porBanco.map(({ banco, monto }) => (
                  <LineaEstado key={banco} etiqueta={banco} valor={monto} />
                ))}
              </SeccionEstado>
            )}
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteFlujoEgresos;
