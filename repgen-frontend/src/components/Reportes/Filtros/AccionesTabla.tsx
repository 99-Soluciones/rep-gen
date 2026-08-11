import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { Column } from "ag-grid-community";
import type { ReportConfigResponse } from "../../../features/reports/shared/api/report-configs.api";
import { useTenantFeatures } from "../../../shared/hooks/useTenantFeatures";

import ModalColumnas from "./ModalColumnas";
import ConfiguracionesColumnas from "./ConfiguracionesColumnas";

interface AccionesTablaProps {
  referenciaGrid: React.RefObject<AgGridReact | null>;
  columnasVisibles: Column[];
  setColumnasVisibles: (val: Column[]) => void;
  reportId: string;
  configs: ReportConfigResponse[];
  onConfigsChange: () => Promise<void>;
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
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. Gestión de vistas (configuraciones de columnas guardadas) */}
      {habilitarConfiguraciones && (
        <ConfiguracionesColumnas
          referenciaGrid={referenciaGrid}
          setColumnasVisibles={setColumnasVisibles}
          reportId={reportId}
          configs={configs}
          onConfigsChange={onConfigsChange}
        />
      )}

      {/* 2. Menú de Columnas */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setMostrarMenuColumnas(true);
          }}
          className="group bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 font-medium py-1.5 px-3 rounded-lg shadow-sm flex items-center justify-center transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1.5 text-gray-500 group-hover:text-blue-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
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
