import AccionesTabla from "./AccionesTabla";
import ActualizarDatos from "./ActualizarDatos";
import BotonExportar from "./BotonExportar";
import FiltroFechas from "./FiltroFechas";
import { desplazarRango } from "./desplazarRango";
import type { useReporteBase } from "./useReporteBase";
import type { useReporteGrid } from "./useReporteGrid";

interface ToolbarReporteProps {
  base: Pick<
    ReturnType<typeof useReporteBase>,
    | "estaCargando"
    | "error"
    | "fechaDesde"
    | "setFechaDesde"
    | "fechaHasta"
    | "setFechaHasta"
    | "aplicarRango"
    | "versionRango"
    | "cargadoEn"
    | "reintentar"
  >;
  grid: ReturnType<typeof useReporteGrid>;
  reportId: string;
  /** Prefijo del CSV; se le agrega el rango aplicado. */
  nombreArchivo: string;
}

/**
 * Barra común de las pantallas de reporte: fechas, acciones de columnas/vistas
 * y exportar. Devuelve los tres slots de TablaDinamica (van en lugares
 * distintos de la barra), para esparcirlos: `<TablaDinamica {...toolbarReporte(...)} />`.
 */
export const toolbarReporte = ({
  base,
  grid,
  reportId,
  nombreArchivo,
}: ToolbarReporteProps) => {
  const anterior = desplazarRango({ desde: base.fechaDesde, hasta: base.fechaHasta }, -1);
  return {
  // Rango sin movimientos: lo siguiente que uno haría es mirar el periodo anterior.
  accionSinRegistros: anterior
    ? { etiqueta: "Ver periodo anterior", onClick: () => base.aplicarRango(anterior.desde, anterior.hasta) }
    : undefined,
  accionesToolbarInicio: (
    <>
      <FiltroFechas
        // Una vista con periodo cambia las fechas: el borrador se reinicia.
        key={base.versionRango}
        fechaDesde={base.fechaDesde}
        setFechaDesde={base.setFechaDesde}
        fechaHasta={base.fechaHasta}
        setFechaHasta={base.setFechaHasta}
      />
      {/* Con error no hay datos que fechar: la tabla ofrece Reintentar. */}
      {!base.error && (
        <ActualizarDatos
          cargadoEn={base.cargadoEn}
          estaCargando={base.estaCargando}
          onActualizar={base.reintentar}
        />
      )}
    </>
  ),
  accionesToolbar: (
    <AccionesTabla
      referenciaGrid={grid.referenciaGrid}
      columnasVisibles={grid.columnasVisibles}
      setColumnasVisibles={grid.setColumnasVisibles}
      reportId={reportId}
      configs={grid.configs}
      onConfigsChange={grid.refreshConfigs}
      rango={{ desde: base.fechaDesde, hasta: base.fechaHasta }}
      onAplicarRango={base.aplicarRango}
      vistaActual={grid.vistaActual}
      vistaBase={grid.vistaBase}
      onVistaAplicada={(id) => grid.fijarBase(id)}
      vistaElegida={grid.vistaElegida}
      onElegirVista={grid.elegirVista}
    />
  ),
  accionesToolbarFin: (
    <BotonExportar
      referenciaGrid={grid.referenciaGrid}
      nombreArchivo={`${nombreArchivo}_${base.fechaDesde}_a_${base.fechaHasta}`}
      motivoDeshabilitado={
        base.estaCargando
          ? "Espera a que terminen de cargar los registros"
          : base.error
            ? "No hay registros cargados que exportar"
            : grid.filasVisibles === 0
              ? "No hay registros que exportar con estas fechas y filtros"
              : null
      }
    />
  ),
  };
};
