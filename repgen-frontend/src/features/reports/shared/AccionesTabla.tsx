import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { Column } from "ag-grid-community";
import { Columns3 } from "lucide-react";
import type { ReportConfigResponse } from "./api/report-configs.api";
import type { VistaCapturada } from "./ConfiguracionesColumnas/vista";
import { useTenantFeatures } from "./useTenantFeatures";

import ModalColumnas from "./ModalColumnas";
import ConfiguracionesColumnas from "./ConfiguracionesColumnas/ConfiguracionesColumnas";

interface AccionesTablaProps {
  referenciaGrid: React.RefObject<AgGridReact | null>;
  columnasVisibles: Column[];
  setColumnasVisibles: (val: Column[]) => void;
  reportId: string;
  configs: ReportConfigResponse[];
  onConfigsChange: () => Promise<void>;
  /** Rango aplicado y cómo cambiarlo: lo usan las vistas con periodo. */
  rango?: { desde: string; hasta: string };
  onAplicarRango?: (desde: string, hasta: string) => void;
  vistaActual?: VistaCapturada | null;
  vistaBase?: { configId: string | null; huella: string } | null;
  onVistaAplicada?: (configId: string | null) => void;
  vistaElegida?: string | null;
  onElegirVista?: (configId: string | null) => void;
}

/**
 * Agrupa las acciones de columnas que operan sobre la tabla (mostrar/ocultar
 * columnas y configuraciones guardadas). Se compone en el padre y se pasa a
 * TablaDinamica mediante su slot `accionesToolbar`, para mantener TablaDinamica
 * genérica y desacoplada de los conceptos de reporte. La exportación vive en un
 * slot aparte (`BotonExportar` en `accionesToolbarFin`) para quedar al extremo
 * derecho.
 */
const AccionesTabla = ({
  referenciaGrid,
  columnasVisibles,
  setColumnasVisibles,
  reportId,
  configs,
  onConfigsChange,
  rango,
  onAplicarRango,
  vistaActual,
  vistaBase,
  onVistaAplicada,
  vistaElegida,
  onElegirVista,
}: AccionesTablaProps) => {
  const { habilitarConfiguraciones } = useTenantFeatures();
  const [mostrarMenuColumnas, setMostrarMenuColumnas] = useState(false);

  const columnasKey = columnasVisibles
    .map(
      (columna) => `${columna.getColId()}:${columna.isVisible() ? "1" : "0"}`,
    )
    .join("|");
  const modalKey = `${mostrarMenuColumnas ? "open" : "closed"}-${columnasKey}`;

  return (
    // contents: vistas, columnas y exportar se acomodan como hermanos en la barra.
    <div className="contents">
      {/* 1. Gestión de vistas (configuraciones de columnas guardadas) */}
      {habilitarConfiguraciones && (
        <ConfiguracionesColumnas
          // Facturas y Conceptos comparten pantalla: cada reporte tiene sus
          // vistas, así que el selector (y su deshacer) se recrea; la vista
          // elegida vuelve con vistaInicial.
          key={reportId}
          referenciaGrid={referenciaGrid}
          setColumnasVisibles={setColumnasVisibles}
          reportId={reportId}
          configs={configs}
          onConfigsChange={onConfigsChange}
          rango={rango}
          onAplicarRango={onAplicarRango}
          vistaActual={vistaActual}
          vistaBase={vistaBase}
          onVistaAplicada={onVistaAplicada}
          vistaInicial={vistaElegida}
          onElegirVista={onElegirVista}
        />
      )}

      {/* 2. Menú de Columnas */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setMostrarMenuColumnas(true);
          }}
          className="group bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 font-medium py-1.5 px-3 pointer-coarse:min-h-10 rounded-lg shadow-sm flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          <Columns3
            aria-hidden="true"
            className="w-4 h-4 mr-1.5 text-gray-500 group-hover:text-blue-600 shrink-0"
          />
          <span className="text-sm">Columnas</span>
        </button>

        <ModalColumnas
          key={modalKey}
          abierto={mostrarMenuColumnas}
          onCerrar={() => setMostrarMenuColumnas(false)}
          columnasVisibles={columnasVisibles}
          setColumnasVisibles={setColumnasVisibles}
          referenciaGrid={referenciaGrid}
        />
      </div>
    </div>
  );
};

export default AccionesTabla;
