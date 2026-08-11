import React, { useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from "ag-grid-community";
import type { ColDef, GridReadyEvent } from "ag-grid-community";
import TablaDinamicaControles from "./TablaDinamicaControles";

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

  const handleModelUpdated = () => {
    if (!onActualizacionModulo) return;
    if (typeof window === "undefined") {
      onActualizacionModulo();
      return;
    }

    if (modelUpdateRafRef.current !== null) return;
    modelUpdateRafRef.current = window.requestAnimationFrame(() => {
      modelUpdateRafRef.current = null;
      onActualizacionModulo();
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
      <div className="w-full px-2 relative flex-1 flex flex-col min-h-0">
        {estaCargando && (
          <div className="absolute inset-4 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
            <svg
              className="animate-spin h-10 w-10 text-blue-600 mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
              Actualizando datos...
            </span>
          </div>
        )}

        <div
          style={{
            height: "calc(110vh - 230px)",
            minHeight: "400px",
            width: "100%",
          }}
          className="w-full shadow-lg rounded-lg overflow-hidden mb-2 bg-white border border-gray-100 flex flex-col"
        >
          <TablaDinamicaControles
            totalDatos={datos.length}
            filasVisibles={filasVisibles}
            accionesToolbarInicio={accionesToolbarInicio}
            accionesToolbar={accionesToolbar}
            accionesToolbarFin={accionesToolbarFin}
          />

          <div className="flex-1 min-h-0" ref={gridContainerRef}>
            <AgGridReact<T>
              ref={referenciaGrid}
              rowData={datos}
              columnDefs={definicionesColumnas}
              theme={themeQuartz}
              rowHeight={49}
              headerHeight={56}
              onGridReady={handleGridReady}
              overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${datos?.length === 0 && !estaCargando ? "No se encontraron registros" : "Cargando registros..."}</span>`}
              defaultColDef={defaultColDef}
              onModelUpdated={handleModelUpdated}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaDinamica;
