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
import { LineaEstado, NotaRegistros, ResultadoCompacto, SeccionEstado } from "../shared/EstadoKpi";
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
            valor={totales.balance}
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
            totales.otraMoneda > 0
              ? `Solo MXN · ${totales.otraMoneda.toLocaleString("es-MX")} ${
                  totales.otraMoneda === 1 ? "movimiento" : "movimientos"
                } en otra moneda sin sumar`
              : "Solo transacciones en MXN"
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
