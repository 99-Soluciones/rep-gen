import { useState } from "react";
import type { ReportPurchaseItemRecord } from "@repgen/shared-types";
import EncabezadoReporte from "../shared/EncabezadoReporte";
import TablaDinamica from "../shared/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../shared/PanelKpiLateral";
import { estadoCifras } from "../shared/estadoCifras";
import { useReporteBase } from "../shared/useReporteBase";
import { useReporteGrid } from "../shared/useReporteGrid";
import { usePreferenciaLocal } from "../shared/usePreferenciaLocal";
import { useComparacionPeriodo } from "../shared/useComparacionPeriodo";
import { useColumnLabels } from "../shared/column-labels/useColumnLabels";
import { toolbarReporte } from "../shared/toolbarReporte";
import {
  LineaEstado,
  NotaRegistros,
  ResultadoCompacto,
  ResultadoResumen,
  SeccionEstado,
} from "../shared/EstadoKpi";
import { construirColumnasComprasConceptos } from "./columnas";
import {
  granTotalCompras,
  resumenCompras,
  type ResumenCompras,
} from "./calcularComprasConceptos";

const ENDPOINT = "compras-conceptos/buscar";

// El total y el saldo de la factura se repiten en cada concepto: una vez por compra.
const totalesTabla = {
  campos: [
    "articuloImporteConDescuentoMxn",
    "articuloIVAMxn",
    "articuloIVARetenidoMxn",
    "articuloISRretenidoMxn",
    "articuloGranTotalMxn",
  ],
  unaVezPor: {
    clave: (fila: ReportPurchaseItemRecord) => fila.compraId,
    campos: ["facturaGranTotalMxn", "facturaSaldoActual"],
  },
  etiqueta: "Total MXN",
};

const SIN_RESUMEN: ResumenCompras = resumenCompras([]);

const onErrorReporte = (error: unknown) => {
  console.error("Error al obtener las compras por concepto:", error);
};

const ReporteComprasConceptos = () => {
  const base = useReporteBase<ReportPurchaseItemRecord>({
    endpoint: ENDPOINT,
    onError: onErrorReporte,
  });
  const { datos, estaCargando, error, reintentar, aplicarRango } = base;
  const { getLabel } = useColumnLabels();

  const [mostrarResumen, setMostrarResumen] = usePreferenciaLocal(
    "kpi-panel-compras-conceptos-abierto",
    true,
  );
  const grid = useReporteGrid("compras_conceptos", aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;

  // Sobre las filas que dejan los filtros de la tabla.
  const [resumen, setResumen] = useState<ResumenCompras>(SIN_RESUMEN);
  const recalcularTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: ReportPurchaseItemRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as ReportPurchaseItemRecord);
    });
    setResumen(resumenCompras(filas));
  };

  const tipos = Object.keys(resumen.porTipo).sort();
  const filtrado = filasVisibles !== datos.length;
  const estado = estadoCifras(error, estaCargando, base.cargadoEn);
  const comparacion = useComparacionPeriodo<ReportPurchaseItemRecord>({
    endpoint: ENDPOINT,
    desde: base.fechaDesde,
    hasta: base.fechaHasta,
    calcular: granTotalCompras,
    intento: base.intento,
  });

  return (
    <div className="flex flex-col xl:h-full">
      <EncabezadoReporte titulo="Reporte de Compras" tituloPagina="Compras · Conceptos" />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        <div className="flex-none min-w-0 flex flex-col min-h-[100cqh] xl:flex-1 xl:min-h-0">
          <ResultadoCompacto
            etiqueta="Compras aprobadas"
            filtrado={filtrado}
            valor={resumen.granTotal}
            estado={estado}
            onAbrirResumen={() => setMostrarResumen(true)}
          />
          <TablaDinamica<ReportPurchaseItemRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={construirColumnasComprasConceptos(getLabel)}
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
              reportId: "compras_conceptos",
              nombreArchivo: "reporte_compras_conceptos",
            })}
          />
        </div>

        <PanelKpiLateral
          aviso="Importes en MXN"
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-compras-conceptos"
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
            <SeccionEstado titulo="Por tipo de concepto">
              {tipos.map((tipo) => (
                <LineaEstado key={tipo} etiqueta={tipo} valor={resumen.porTipo[tipo]} />
              ))}
            </SeccionEstado>
            <SeccionEstado
              titulo="Facturas"
              nota="Cada compra se cuenta una vez, aunque tenga varios conceptos."
            >
              <LineaEstado etiqueta="Gran total de facturas" valor={resumen.facturasGranTotal} />
              <LineaEstado etiqueta="Saldo por pagar" valor={resumen.saldo} />
            </SeccionEstado>
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteComprasConceptos;
