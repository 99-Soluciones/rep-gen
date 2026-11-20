import { useState } from "react";
import type { ReportPurchaseRecord } from "@repgen/shared-types";
import EncabezadoReporte from "../shared/EncabezadoReporte";
import TablaDinamica from "../shared/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../shared/PanelKpiLateral";
import { estadoCifras } from "../shared/estadoCifras";
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
import { PESTANAS_COMPRAS, RUTA_COMPRAS } from "./pestanas";
import { columnasCompras } from "./columnas";
import {
  granTotalComprasGeneral,
  resumenComprasGeneral,
  type ResumenComprasGeneral,
} from "./calcularCompras";

const ENDPOINT = "compras/buscar";

const totalesTabla = {
  campos: [
    "importeConDescuentoMxn",
    "ivaMxn",
    "ivaRetenidoMxn",
    "isrRetenidoMxn",
    "facturaGranTotalMxn",
    "facturaSaldoActual",
  ],
  etiqueta: "Total MXN",
};

const SIN_RESUMEN: ResumenComprasGeneral = resumenComprasGeneral([]);

const onErrorReporte = (error: unknown) => {
  console.error("Error al obtener las compras:", error);
};

const ReporteCompras = () => {
  const base = useReporteBase<ReportPurchaseRecord>({
    endpoint: ENDPOINT,
    onError: onErrorReporte,
  });
  const { datos, estaCargando, error, reintentar, aplicarRango } = base;

  const [mostrarResumen, setMostrarResumen] = usePreferenciaLocal(
    "kpi-panel-compras-abierto",
    true,
  );
  const grid = useReporteGrid("compras", aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;

  // Sobre las filas que dejan los filtros de la tabla.
  const [resumen, setResumen] = useState<ResumenComprasGeneral>(SIN_RESUMEN);
  const recalcularTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: ReportPurchaseRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as ReportPurchaseRecord);
    });
    setResumen(resumenComprasGeneral(filas));
  };

  const filtrado = filasVisibles !== datos.length;
  const estado = estadoCifras(error, estaCargando, base.cargadoEn);
  const comparacion = useComparacionPeriodo<ReportPurchaseRecord>({
    endpoint: ENDPOINT,
    desde: base.fechaDesde,
    hasta: base.fechaHasta,
    calcular: granTotalComprasGeneral,
    intento: base.intento,
  });
  const { Liquidado, Vencida, Vigente } = resumen.porEstatus;

  return (
    <div className="flex flex-col xl:h-full">
      <EncabezadoReporte
        titulo="Reporte de Compras"
        tituloPagina="Compras · Compras"
        encabezadoExtra={
          <TabsVentas reportType="general" rutaBase={RUTA_COMPRAS} pestanas={PESTANAS_COMPRAS} />
        }
      />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        <div className="flex-none min-w-0 flex flex-col min-h-[100cqh] xl:flex-1 xl:min-h-0">
          <ResultadoCompacto
            etiqueta="Compras aprobadas"
            filtrado={filtrado}
            valor={resumen.granTotal}
            estado={estado}
            onAbrirResumen={() => setMostrarResumen(true)}
          />
          <TablaDinamica<ReportPurchaseRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={columnasCompras}
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
              reportId: "compras",
              nombreArchivo: "reporte_compras",
            })}
          />
        </div>

        <PanelKpiLateral
          aviso="Importes en MXN"
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-compras"
          estado={estado}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
            <ResultadoResumen
              etiqueta="Compras aprobadas"
              valor={resumen.granTotal}
              comparacion={comparacion}
              filtrado={filtrado}
            />
            <NotaRegistros
              registros={filasVisibles}
              total={datos.length}
              desde={base.fechaDesde}
              hasta={base.fechaHasta}
            />
            <SeccionEstado titulo="Desglose">
              <LineaEstado etiqueta="Importe con descuento" valor={resumen.importeConDescuento} />
              <LineaEstado etiqueta="IVA" valor={resumen.iva} />
              <LineaEstado etiqueta="IVA retenido" valor={-resumen.ivaRetenido} />
              <LineaEstado etiqueta="ISR retenido" valor={-resumen.isrRetenido} />
              <LineaEstado etiqueta="Gran total" valor={resumen.granTotal} total />
            </SeccionEstado>
            <SeccionEstado
              titulo="Saldo por pagar"
              nota={`${Liquidado.compras} ${Liquidado.compras === 1 ? "compra liquidada" : "compras liquidadas"}, sin saldo.`}
            >
              <LineaEstado etiqueta={`Vencidas (${Vencida.compras})`} valor={Vencida.saldo} />
              <LineaEstado etiqueta={`Vigentes (${Vigente.compras})`} valor={Vigente.saldo} />
              <LineaEstado etiqueta="Saldo por pagar" valor={resumen.saldo} total />
            </SeccionEstado>
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteCompras;
