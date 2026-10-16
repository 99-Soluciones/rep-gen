import { useState } from "react";
import EncabezadoReporte from "../shared/EncabezadoReporte";
import TablaDinamica from "../shared/TablaDinamica/TablaDinamica";
import PanelKpiLateral from "../shared/PanelKpiLateral";
import { estadoCifras } from "../shared/estadoCifras";
import type { ReportBankRecord } from "@repgen/shared-types";
import { columnasBancos } from "./columnas";
import { useReporteBase } from "../shared/useReporteBase";
import { useReporteGrid } from "../shared/useReporteGrid";
import { usePreferenciaLocal } from "../shared/usePreferenciaLocal";
import {
  LineaComparacion,
  LineaEstado,
  NotaRegistros,
  ResultadoCompacto,
  SeccionEstado,
} from "../shared/EstadoKpi";
import { useComparacionPeriodo } from "../shared/useComparacionPeriodo";
import { flujoNetoMxn, movimientosPorMoneda, saldosAlCierre, type MovimientosMoneda } from "./calcularBancos";
import { toolbarReporte } from "../shared/toolbarReporte";

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
  const base = useReporteBase<ReportBankRecord>({
    endpoint: "bancos/buscar",
    onError: onErrorReporte,
  });
  const { datos, estaCargando, error, reintentar, aplicarRango } = base;

  const [mostrarResumen, setMostrarResumen] = usePreferenciaLocal("kpi-panel-bancos-abierto", true);
  const grid = useReporteGrid("bancos", aplicarRango);
  const { referenciaGrid, filasVisibles, actualizarFilasVisibles, onGridListo, onCambioVista } =
    grid;

  // Resumen: cada moneda se suma aparte (MXN arriba; las demás, cada una en
  // su moneda), sobre las filas que dejan los filtros de la tabla.
  const [porMoneda, setPorMoneda] = useState<Record<string, MovimientosMoneda>>({});

  const recalcularTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const filas: ReportBankRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) filas.push(node.data as ReportBankRecord);
    });
    setPorMoneda(movimientosPorMoneda(filas));
  };

  const mxn = porMoneda.MXN ?? { abonos: 0, cargos: 0 };
  const flujoMxn = mxn.abonos - mxn.cargos;
  const otrasMonedas = Object.keys(porMoneda).filter((m) => m !== "MXN").sort();
  // Saldos con todos los movimientos del rango: un filtro de la tabla
  // cambiaría cuál es "el último" y el saldo no sería el de la cuenta.
  const saldos = saldosAlCierre(datos);
  const filtrado = filasVisibles !== datos.length;
  const comparacion = useComparacionPeriodo<ReportBankRecord>({
    endpoint: "bancos/buscar",
    desde: base.fechaDesde,
    hasta: base.fechaHasta,
    calcular: flujoNetoMxn,
  });

  return (
    <div className="flex flex-col xl:h-full">
      <EncabezadoReporte
        titulo="Reporte de Bancos"
        tituloPagina="Bancos"
      />

      <div className="flex flex-col xl:flex-row xl:flex-1 xl:min-h-0 gap-2">
        {/* Bajo xl, resultado + tabla ocupan la primera pantalla (100cqh, el
            alto de <main>) y el resumen queda debajo; en xl, alto completo.
            Es un mínimo: en pantallas bajas (zoom 200%, teléfono horizontal)
            la tabla conserva sus filas y la página hace scroll. flex-none bajo
            xl: con flex-1 la base 0% ignoraría el alto. */}
        <div className="flex-none min-w-0 flex flex-col min-h-[100cqh] xl:flex-1 xl:min-h-0">
          <ResultadoCompacto
            etiqueta="Flujo neto"
            filtrado={filasVisibles !== datos.length}
            valor={flujoMxn}
            estado={estadoCifras(error, estaCargando, base.cargadoEn)}
            onAbrirResumen={() => setMostrarResumen(true)}
          />
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
            {...toolbarReporte({
              base,
              grid,
              reportId: "bancos",
              nombreArchivo: "reporte_bancos",
            })}
          />
        </div>

        <PanelKpiLateral
          aviso={
            otrasMonedas.length > 0
              ? `Cada moneda por separado: MXN, ${otrasMonedas.join(", ")}`
              : "Importes en MXN"
          }
          abierto={mostrarResumen}
          onToggle={() => setMostrarResumen(!mostrarResumen)}
          storageKey="kpi-panel-bancos"
          estado={estadoCifras(error, estaCargando, base.cargadoEn)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
            <NotaRegistros
              registros={filasVisibles}
              total={datos.length}
              desde={base.fechaDesde}
              hasta={base.fechaHasta}
            />
            <SeccionEstado titulo={otrasMonedas.length > 0 ? "Movimientos en MXN" : "Movimientos"}>
              <LineaEstado etiqueta="Abonos" valor={mxn.abonos} />
              <LineaEstado etiqueta="Cargos" valor={-mxn.cargos} />
              <LineaEstado etiqueta="Flujo neto" valor={flujoMxn} total />
              <LineaComparacion actual={flujoMxn} comparacion={comparacion} filtrado={filtrado} />
            </SeccionEstado>
            {otrasMonedas.map((codigo) => (
              <SeccionEstado key={codigo} titulo={`Movimientos en ${codigo}`}>
                <LineaEstado etiqueta="Abonos" valor={porMoneda[codigo].abonos} codigoMoneda={codigo} />
                <LineaEstado etiqueta="Cargos" valor={-porMoneda[codigo].cargos} codigoMoneda={codigo} />
                <LineaEstado
                  etiqueta="Flujo neto"
                  valor={porMoneda[codigo].abonos - porMoneda[codigo].cargos}
                  codigoMoneda={codigo}
                  total
                />
              </SeccionEstado>
            ))}
            {saldos.length > 0 && (
              <SeccionEstado
                titulo="Saldos al cierre"
                nota="Saldo resultante del último movimiento de cada cuenta en el rango, con todos los movimientos (sin los filtros de la tabla)."
              >
                {saldos.map((s) => (
                  <LineaEstado
                    key={`${s.banco}|${s.cuenta}`}
                    etiqueta={`${s.banco}${s.cuenta ? ` ··${s.cuenta.slice(-4)}` : ""}`}
                    valor={s.saldo}
                    codigoMoneda={s.moneda}
                  />
                ))}
              </SeccionEstado>
            )}
          </div>
        </PanelKpiLateral>
      </div>
    </div>
  );
};

export default ReporteBancos;
