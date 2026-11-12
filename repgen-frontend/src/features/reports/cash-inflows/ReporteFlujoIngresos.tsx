import { useState } from "react";
import { useParams } from "react-router-dom";
import type { ReportCashInflowRecord } from "@repgen/shared-types";
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
import { construirColumnasIngresos } from "./columnas";
import { calcularTotalesIngresos, totalIngresos, type TotalesIngresos } from "./calcularIngresos";

const RUTA_INGRESOS = "/flujo_efectivo_ingresos";

type Pestana = "facturas" | "conceptos";

const VISTAS = {
  facturas: {
    detalle: "factura",
    endpoint: "flujo-efectivo-ingresos/buscar",
    reportId: "flujo_efectivo_ingresos_facturas",
    nombreArchivo: "reporte_ingresos_facturas",
    titulo: "Facturas",
  },
  conceptos: {
    detalle: "concepto",
    endpoint: "flujo-efectivo-ingresos-por-concepto/buscar",
    reportId: "flujo_efectivo_ingresos_conceptos",
    nombreArchivo: "reporte_ingresos_conceptos",
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
    "costoDirectoSubTotalMxn",
    "gananciaBrutaMxn",
  ],
  etiqueta: "Total MXN",
};

const SIN_TOTALES: TotalesIngresos = {
  total: 0,
  aplicado: 0,
  sinAplicar: 0,
  noIdentificado: 0,
  porBanco: [],
};

const onErrorReporte = (error: unknown) => {
  console.error("Error cargando reporte de ingresos:", error);
};

const ReporteFlujoIngresos = () => {
  const params = useParams<{ reportType?: string }>();
  const pestana: Pestana = params.reportType === "conceptos" ? "conceptos" : "facturas";
  const vista = VISTAS[pestana];
  const { getLabel } = useColumnLabels();

  const base = useReporteBase<ReportCashInflowRecord>({
    endpoint: vista.endpoint,
    onError: onErrorReporte,
  });
  const { datos, estaCargando, error, reintentar, aplicarRango } = base;

  const [mostrarResumen, setMostrarResumen] = usePreferenciaLocal("kpi-panel-ingresos-abierto", true);
  const grid = useReporteGrid(vista.reportId, aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;

  // El resumen se calcula sobre las filas que dejan los filtros de la tabla.
  const [totales, setTotales] = useState<TotalesIngresos>(SIN_TOTALES);
  const recalcularTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: ReportCashInflowRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as ReportCashInflowRecord);
    });
    setTotales(calcularTotalesIngresos(filas));
  };

  const filtrado = filasVisibles !== datos.length;
  const estado = estadoCifras(error, estaCargando, base.cargadoEn);
  const comparacion = useComparacionPeriodo<ReportCashInflowRecord>({
    endpoint: vista.endpoint,
    desde: base.fechaDesde,
    hasta: base.fechaHasta,
    calcular: totalIngresos,
    intento: base.intento,
  });

  return (
    <div className="flex flex-col w-full xl:h-full">
      <EncabezadoReporte
        titulo="Flujo de efectivo - Ingresos"
        tituloPagina={`Ingresos · ${vista.titulo}`}
        encabezadoExtra={<TabsVentas reportType={pestana} rutaBase={RUTA_INGRESOS} />}
      />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        {/* Mismo reparto de alto que Bancos y Ventas (ver ReporteBancos). */}
        <div className="flex-none min-w-0 flex flex-col min-h-[100cqh] xl:flex-1 xl:min-h-0">
          <ResultadoCompacto
            etiqueta="Ingresos del periodo"
            filtrado={filtrado}
            valor={totales.total}
            estado={estado}
            onAbrirResumen={() => setMostrarResumen(true)}
          />
          <TablaDinamica<ReportCashInflowRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={construirColumnasIngresos(vista.detalle, getLabel)}
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
          storageKey="kpi-panel-ingresos"
          estado={estado}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
            <ResultadoResumen
              etiqueta="Ingresos del periodo"
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
              nota="Un pago con complemento cuenta en la fecha del complemento; los depósitos sin aplicar, en la fecha del banco."
            >
              <LineaEstado etiqueta="Aplicado a facturas" valor={totales.aplicado} />
              <LineaEstado etiqueta="Sin aplicar (con cliente)" valor={totales.sinAplicar} />
              <LineaEstado etiqueta="No identificado" valor={totales.noIdentificado} />
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

export default ReporteFlujoIngresos;
