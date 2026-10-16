import React, { useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  CellStyleModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  ColumnAutoSizeModule,
  CsvExportModule,
  CustomFilterModule,
  DateFilterModule,
  LocaleModule,
  ModuleRegistry,
  NumberFilterModule,
  PinnedRowModule,
  RowApiModule,
  TextFilterModule,
  ValidationModule,
  themeQuartz,
} from "ag-grid-community";
import type { ColDef, GridReadyEvent, IOverlayParams } from "ag-grid-community";
import TablaDinamicaControles from "./TablaDinamicaControles";
import { calcularFilaTotales, type TotalesTabla } from "./totales";
import { describirFiltros, type FiltroDescrito } from "./describirFiltros";
import { LOCALE_ES } from "../ag-grid/locale-es";
import type { ErrorCarga } from "../useReporteBase";
import { avisarConDeshacer } from "../avisarConDeshacer";

// Solo los módulos que usan los reportes (AllCommunityModule pesa ~1 MB).
// Si se usa una API o propiedad nueva de AG Grid, ValidationModule (solo en
// desarrollo) indica en consola qué módulo falta registrar aquí.
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ClientSideRowModelApiModule, // forEachNodeAfterFilter(AndSort)
  RowApiModule, // getDisplayedRowCount
  ColumnApiModule, // getColumns, applyColumnState, getColumnState
  ColumnAutoSizeModule, // sizeColumnsToFit
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CellStyleModule, // tipo numericColumn (alineación a la derecha)
  CsvExportModule,
  CustomFilterModule, // FiltroLista (columnas de lista)
  PinnedRowModule, // fila de totales
  LocaleModule, // localeText en español (ag-grid/locale-es.ts)
  ...(import.meta.env.DEV ? [ValidationModule] : []),
]);

// Tema del sistema ("El Libro Mayor Claro", DESIGN.md). Con la Theming API la
// grilla no lleva la clase .ag-theme-quartz: el estilo va en los parámetros.
const temaGrid = themeQuartz.withParams({
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 14,
  foregroundColor: "#111827",
  // Token de marca (index.css): si un tenant cambia su azul, la grilla lo sigue.
  accentColor: "var(--color-blue-600, #2670e3)",
  borderColor: "#e5e7eb",
  wrapperBorder: false,
  headerBackgroundColor: "#f9fafb",
  headerTextColor: "#4b5563",
  headerFontWeight: 600,
  headerColumnBorder: false,
  headerColumnResizeHandleColor: "#d1d5db",
  rowBorder: { color: "#f3f4f6" },
  columnBorder: false,
  rowHoverColor: "var(--color-blue-50, #eff6ff)",
  pinnedRowBackgroundColor: "#f9fafb",
  pinnedRowFontWeight: 700,
  pinnedRowBorder: { color: "#d1d5db" },
});

/**
 * Sin filas que mostrar. Si hay registros pero los filtros los excluyen todos,
 * la salida está aquí mismo: "Limpiar filtros" (con su aviso para deshacer).
 */
const SinFilas = ({
  overlayType,
  onLimpiarFiltros,
}: IOverlayParams & { onLimpiarFiltros: () => void }) => {
  const hayRegistros = overlayType === "noMatchingRows";
  return (
    <div className="flex flex-col items-center gap-3 px-4 text-center text-sm text-gray-600">
      <p>
        {hayRegistros
          ? "Ningún registro coincide con los filtros."
          : "No hay registros en este rango de fechas."}
      </p>
      {hayRegistros && (
        <button
          type="button"
          onClick={onLimpiarFiltros}
          // El overlay de AG Grid no recibe clics; el botón sí.
          className="pointer-events-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
};

const elegirOverlay = ({ overlayType }: IOverlayParams) =>
  overlayType === "noRows" || overlayType === "noMatchingRows" ? { component: SinFilas } : undefined;

// Función pura de módulo (no un closure del componente) para que React
// Compiler no necesite estabilizarla: recibe los refs como parámetros en vez
// de capturarlos, así el efecto que la usa no necesita su identidad como
// dependencia (ver no-manual-memoization / no-effect-with-fresh-deps).
function scheduleGridFit(
  gridRef: React.RefObject<AgGridReact | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  rafRef: React.RefObject<number | null>,
) {
  if (typeof window === "undefined") return;
  if (rafRef.current !== null) return;

  rafRef.current = window.requestAnimationFrame(() => {
    rafRef.current = null;
    const api = gridRef.current?.api;
    const width = containerRef.current?.clientWidth ?? 0;
    if (!api || width === 0) return;
    api.sizeColumnsToFit();
  });
}

interface TablaDinamicaProps<T> {
  referenciaGrid: React.RefObject<AgGridReact | null>;
  datos: T[];
  definicionesColumnas: ColDef<T>[];
  estaCargando: boolean;
  /** Falla de la última carga; se muestra sobre el grid (la toolbar sigue usable). */
  error?: ErrorCarga | null;
  onReintentar?: () => void;
  /** Fila fija al pie con la suma de las filas filtradas. */
  totales?: TotalesTabla<T>;
  /**
   * Cambió algo que guarda una vista (columnas, orden, filtros). Va por props de
   * AgGridReact: los listeners con api.addEventListener no reciben estos eventos.
   */
  onCambioVista?: () => void;
  onGridListo: (event: GridReadyEvent<T>) => void;
  onActualizacionModulo?: () => void;
  accionesToolbarInicio?: React.ReactNode;
  accionesToolbar?: React.ReactNode;
  accionesToolbarFin?: React.ReactNode;
  filasVisibles: number;
}

const TablaDinamica = <T,>({
  referenciaGrid,
  datos,
  definicionesColumnas,
  estaCargando,
  error,
  onReintentar,
  totales,
  onCambioVista,
  onGridListo,
  onActualizacionModulo,
  accionesToolbarInicio,
  accionesToolbar,
  accionesToolbarFin,
  filasVisibles,
}: TablaDinamicaProps<T>) => {
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const modelUpdateRafRef = useRef<number | null>(null);
  const filaTotalesRef = useRef<string | null>(null);
  const [filtros, setFiltros] = useState<FiltroDescrito[]>([]);
  // Filtros que quitó "Limpiar": el chip ofrece restaurarlos hasta que se filtre
  // de nuevo (el aviso con Deshacer se va solo y por teclado cuesta alcanzarlo).
  const [filtrosQuitados, setFiltrosQuitados] = useState<Record<string, unknown> | null>(null);

  // Qué columnas tienen filtro (algunas pueden estar fuera de pantalla u ocultas).
  const leerFiltros = () => {
    const api = referenciaGrid.current?.api;
    if (!api || api.isDestroyed()) return;
    const actuales = describirFiltros(api);
    // modelUpdated es frecuente: sin cambios, se conserva el estado y no re-renderiza.
    setFiltros((previos) =>
      JSON.stringify(previos) === JSON.stringify(actuales) ? previos : actuales,
    );
    if (actuales.length > 0) setFiltrosQuitados(null);
  };

  const quitarFiltro = (colId: string) => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const modelo = { ...api.getFilterModel() };
    delete modelo[colId];
    api.setFilterModel(modelo);
  };

  const restaurarFiltros = () => {
    const api = referenciaGrid.current?.api;
    if (!api || api.isDestroyed() || !filtrosQuitados) return;
    // Solo columnas que siguen existiendo (p. ej. tras cambiar de pestaña).
    api.setFilterModel(
      Object.fromEntries(Object.entries(filtrosQuitados).filter(([id]) => api.getColumn(id))),
    );
    setFiltrosQuitados(null);
  };

  // Un clic quita varios filtros armados a mano: el aviso permite recuperarlos.
  const limpiarFiltros = () => {
    const api = referenciaGrid.current?.api;
    if (!api) return;
    const previos = api.getFilterModel();
    api.setFilterModel(null);
    const cuantos = Object.keys(previos).length;
    if (cuantos === 0) return;
    setFiltrosQuitados(previos);
    avisarConDeshacer(
      cuantos === 1 ? "Se quitó 1 filtro." : `Se quitaron ${cuantos} filtros.`,
      () => {
        if (!api.isDestroyed()) api.setFilterModel(previos);
      },
    );
  };

  const defaultColDef: ColDef<T> = {
    width: 200,
    minWidth: 150,
    resizable: true,
    filter: true,
    floatingFilter: true,
  };

  const handleGridReady = (event: GridReadyEvent<T>) => {
    onGridListo(event);
    scheduleGridFit(referenciaGrid, gridContainerRef, resizeRafRef);
  };

  const actualizarTotales = () => {
    const api = referenciaGrid.current?.api;
    if (!api || !totales) return;
    const filas = datos.length > 0 ? [calcularFilaTotales(api, totales)] : [];
    // Solo si cambió: setGridOption re-renderiza y modelUpdated es frecuente.
    const serializada = JSON.stringify(filas);
    if (serializada === filaTotalesRef.current) return;
    filaTotalesRef.current = serializada;
    api.setGridOption("pinnedBottomRowData", filas);
  };

  const handleModelUpdated = () => {
    if (typeof window === "undefined") {
      actualizarTotales();
      leerFiltros();
      onActualizacionModulo?.();
      return;
    }

    if (modelUpdateRafRef.current !== null) return;
    modelUpdateRafRef.current = window.requestAnimationFrame(() => {
      modelUpdateRafRef.current = null;
      actualizarTotales();
      leerFiltros();
      onActualizacionModulo?.();
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const node = gridContainerRef.current;
    if (!node) return undefined;

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () =>
        scheduleGridFit(referenciaGrid, gridContainerRef, resizeRafRef);
      window.addEventListener("resize", handleResize);
      scheduleGridFit(referenciaGrid, gridContainerRef, resizeRafRef);
      return () => window.removeEventListener("resize", handleResize);
    }

    const observer = new ResizeObserver(() => {
      scheduleGridFit(referenciaGrid, gridContainerRef, resizeRafRef);
    });
    observer.observe(node);
    scheduleGridFit(referenciaGrid, gridContainerRef, resizeRafRef);

    return () => observer.disconnect();
  }, [referenciaGrid]);

  useEffect(() => {
    const resizeRaf = resizeRafRef.current;
    return () => {
      if (typeof window === "undefined") return;
      if (resizeRaf !== null && typeof resizeRaf === "number") {
        window.cancelAnimationFrame(resizeRaf as number);
      }
      if (modelUpdateRafRef.current !== null) {
        window.cancelAnimationFrame(modelUpdateRafRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col w-full flex-1 min-h-0">
      <div className="w-full p-2 relative flex-1 flex flex-col min-h-0">
        {/* Llena el alto que le da el reporte: bajo xl, la primera pantalla
            (y la página hace scroll hasta el resumen); en xl, junto al panel. */}
        <div className="w-full flex-1 min-h-0 shadow-lg rounded-lg overflow-hidden bg-white border border-gray-100 flex flex-col">
          <TablaDinamicaControles
            totalDatos={datos.length}
            filasVisibles={filasVisibles}
            filtros={filtros}
            onQuitarFiltro={quitarFiltro}
            onLimpiarFiltros={limpiarFiltros}
            onRestaurarFiltros={filtrosQuitados ? restaurarFiltros : undefined}
            sinRegistros={Boolean(error) && !estaCargando}
            cargandoSinDatos={estaCargando && datos.length === 0}
            accionesToolbarInicio={accionesToolbarInicio}
            accionesToolbar={accionesToolbar}
            accionesToolbarFin={accionesToolbarFin}
          />

          {/* min-h-72: encabezado, filtros, totales y ~5 filas aunque la pantalla
              sea baja; si no caben, la barra se va con el scroll de la página. */}
          <div className="relative flex-1 min-h-72" ref={gridContainerRef}>
            {/* Solo sobre el cuerpo: fechas y acciones siguen usables mientras carga. */}
            {estaCargando && (
              <div
                role="status"
                className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
              >
                <svg
                  className="animate-spin motion-reduce:animate-none h-10 w-10 text-blue-600 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm font-semibold text-gray-700">
                  Cargando registros...
                </span>
              </div>
            )}
            {error && !estaCargando && (
              <div
                role="alert"
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white px-6 text-center"
              >
                <div className="rounded-full bg-red-50 p-3">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                </div>
                <div className="max-w-md">
                  <p className="text-sm font-semibold text-gray-800">
                    No se pudieron cargar los registros
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{error.mensaje}</p>
                </div>
                {error.reintentable && onReintentar && (
                  <button
                    type="button"
                    onClick={onReintentar}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-marca-morado transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            )}
            <AgGridReact<T>
              ref={referenciaGrid}
              // Llena el cuerpo por posición, no con height: 100%: bajo xl el
              // alto del cuerpo sale de un mínimo (min-h-72) y un porcentaje
              // no resolvería, el grid quedaría de 0px.
              containerStyle={{ position: "absolute", inset: 0 }}
              rowData={datos}
              columnDefs={definicionesColumnas}
              theme={temaGrid}
              rowHeight={36}
              headerHeight={40}
              onGridReady={handleGridReady}
              // "Sin datos" y "los filtros excluyen todo" con el aviso propio;
              // mientras carga o con error, el velo de arriba ya lo dice.
              overlayComponentSelector={elegirOverlay}
              overlayComponentParams={{ onLimpiarFiltros: limpiarFiltros }}
              suppressOverlays={estaCargando || error ? ["noRows", "noMatchingRows"] : undefined}
              defaultColDef={defaultColDef}
              onModelUpdated={handleModelUpdated}
              onFilterChanged={onCambioVista}
              onSortChanged={onCambioVista}
              onColumnMoved={onCambioVista}
              onColumnVisible={() => {
                // Ocultar una columna filtrada no quita su filtro: el chip lo avisa.
                leerFiltros();
                onCambioVista?.();
              }}
              onColumnPinned={onCambioVista}
              onDisplayedColumnsChanged={onCambioVista}
              localeText={LOCALE_ES}
              // Se puede seleccionar y copiar el valor de una celda. Sin ensureDomOrder:
              // con ~40 columnas mantener el orden del DOM cuesta y solo hace falta
              // para seleccionar a través de varias celdas.
              enableCellTextSelection
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaDinamica;
