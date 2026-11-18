import { useState } from "react";
import type { ReportBankComplementRecord } from "@repgen/shared-types";
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
import { PESTANAS_BANCOS, RUTA_BANCOS } from "../banks/pestanas";
import { columnasBancosComplementos } from "./columnas";
import {
  flujoNetoMxnComplementos,
  resumenComplementos,
  type ResumenComplementos,
} from "./calcularBancosComplementos";

const ENDPOINT = "bancos-complementos/buscar";

// Abono y cargo se repiten en cada complemento del movimiento: se suman una
// vez por movimiento; el pago, en cada renglón. Solo MXN, como Bancos.
const totalesTabla = {
  campos: ["pagoGranTotalMxn"],
  unaVezPor: {
    clave: (fila: ReportBankComplementRecord) => fila.bancoFolioTransaccion,
    campos: ["bancoAbono", "bancoCargo"],
  },
  incluirFila: (fila: ReportBankComplementRecord) => fila.bancoMoneda === "MXN",
  etiqueta: "Total MXN",
};

const SIN_RESUMEN: ResumenComplementos = { porMoneda: {}, pagosMxn: 0 };

const onErrorReporte = (error: unknown) => {
  console.error("Error al obtener los complementos de bancos:", error);
};

const ReporteBancosComplementos = () => {
  const base = useReporteBase<ReportBankComplementRecord>({
    endpoint: ENDPOINT,
    onError: onErrorReporte,
  });
  const { datos, estaCargando, error, reintentar, aplicarRango } = base;

  const [mostrarResumen, setMostrarResumen] = usePreferenciaLocal(
    "kpi-panel-bancos-complementos-abierto",
    true,
  );
  const grid = useReporteGrid("bancos_complementos", aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;

  // Sobre las filas que dejan los filtros de la tabla.
  const [resumen, setResumen] = useState<ResumenComplementos>(SIN_RESUMEN);
  const recalcularTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: ReportBankComplementRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as ReportBankComplementRecord);
    });
    setResumen(resumenComplementos(filas));
  };

  const mxn = resumen.porMoneda.MXN ?? { abonos: 0, cargos: 0, porIdentificar: 0, porComplementar: 0 };
  const flujoMxn = mxn.abonos - mxn.cargos;
  const otrasMonedas = Object.keys(resumen.porMoneda).filter((m) => m !== "MXN").sort();
  const filtrado = filasVisibles !== datos.length;
  const estado = estadoCifras(error, estaCargando, base.cargadoEn);
  const comparacion = useComparacionPeriodo<ReportBankComplementRecord>({
    endpoint: ENDPOINT,
    desde: base.fechaDesde,
    hasta: base.fechaHasta,
    calcular: flujoNetoMxnComplementos,
    intento: base.intento,
  });

  return (
    <div className="flex flex-col xl:h-full">
      <EncabezadoReporte
        titulo="Reporte de Bancos"
        tituloPagina="Bancos · Complementos"
        encabezadoExtra={
          <TabsVentas reportType="complementos" rutaBase={RUTA_BANCOS} pestanas={PESTANAS_BANCOS} />
        }
      />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        <div className="flex-none min-w-0 flex flex-col min-h-[100cqh] xl:flex-1 xl:min-h-0">
          <ResultadoCompacto
            etiqueta="Flujo neto"
            filtrado={filtrado}
            valor={flujoMxn}
            estado={estado}
            onAbrirResumen={() => setMostrarResumen(true)}
          />
          <TablaDinamica<ReportBankComplementRecord>
            referenciaGrid={referenciaGrid}
            datos={datos}
            definicionesColumnas={columnasBancosComplementos}
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
              reportId: "bancos_complementos",
              nombreArchivo: "reporte_bancos_complementos",
            })}
          />
        </div>

        <PanelKpiLateral
          aviso={
            otrasMonedas.length > 0
              ? `Cada moneda por separado: MXN, ${otrasMonedas.join(", ")}. Los pagos, siempre en MXN.`
              : "Importes en MXN"
          }
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-bancos-complementos"
          estado={estado}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
            <ResultadoResumen
              etiqueta={otrasMonedas.length > 0 ? "Flujo neto en MXN" : "Flujo neto"}
              valor={flujoMxn}
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
              titulo={otrasMonedas.length > 0 ? "Movimientos en MXN" : "Movimientos"}
              nota="Cada movimiento se cuenta una vez, aunque tenga varios complementos."
            >
              <LineaEstado etiqueta="Abonos" valor={mxn.abonos} />
              <LineaEstado etiqueta="Cargos" valor={-mxn.cargos} />
              <LineaEstado etiqueta="Flujo neto" valor={flujoMxn} total />
            </SeccionEstado>
            <SeccionEstado titulo="Complementos">
              <LineaEstado etiqueta="Pagos complementados" valor={resumen.pagosMxn} />
              <LineaEstado etiqueta="Saldo por complementar" valor={mxn.porComplementar} />
              <LineaEstado etiqueta="Saldo por identificar" valor={mxn.porIdentificar} />
            </SeccionEstado>
            {otrasMonedas.map((codigo) => {
              const m = resumen.porMoneda[codigo];
              return (
                <SeccionEstado key={codigo} titulo={`Movimientos en ${codigo}`}>
                  <LineaEstado etiqueta="Abonos" valor={m.abonos} codigoMoneda={codigo} />
                  <LineaEstado etiqueta="Cargos" valor={-m.cargos} codigoMoneda={codigo} />
                  <LineaEstado etiqueta="Saldo por complementar" valor={m.porComplementar} codigoMoneda={codigo} />
                  <LineaEstado etiqueta="Saldo por identificar" valor={m.porIdentificar} codigoMoneda={codigo} />
                </SeccionEstado>
              );
            })}
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteBancosComplementos;
