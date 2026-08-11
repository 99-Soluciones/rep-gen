import { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { Column } from "ag-grid-community";

interface ModalColumnasProps {
  abierto: boolean;
  onCerrar: () => void;
  columnasVisibles: Column[];
  setColumnasVisibles: (val: Column[]) => void;
  referenciaGrid: React.RefObject<AgGridReact | null>;
}

const buildEstadoInicial = (columnas: Column[]) => {
  const estadoActual: Record<string, boolean> = {};
  columnas.forEach((columna) => {
    estadoActual[columna.getColId()] = columna.isVisible();
  });
  return estadoActual;
};

const ModalColumnas: React.FC<ModalColumnasProps> = ({
  abierto,
  onCerrar,
  columnasVisibles,
  setColumnasVisibles,
  referenciaGrid,
}) => {
  const [borradorColumnas, setBorradorColumnas] = useState<
    Record<string, boolean>
  >(() => buildEstadoInicial(columnasVisibles));
  const [textoBusqueda, setTextoBusqueda] = useState("");

  const clasesAgrupadas: Record<string, Column[]> = {};
  columnasVisibles.forEach((columna) => {
    const idColumna = columna.getColId();
    const nombreColumna = columna.getColDef().headerName || idColumna;
    if (
      textoBusqueda &&
      !nombreColumna.toLowerCase().includes(textoBusqueda.toLowerCase())
    ) {
      return;
    }
    const def = columna.getColDef() as { claseColumna?: string };
    const clase = def.claseColumna || "General";
    if (!clasesAgrupadas[clase]) clasesAgrupadas[clase] = [];
    clasesAgrupadas[clase].push(columna);
  });

  if (!abierto) return null;

  const api = referenciaGrid.current?.api;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 lg:p-10 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white gap-4">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-xl font-bold text-gray-800">
              Mostrar / Ocultar Columnas
            </h3>
            <button
              type="button"
              onClick={onCerrar}
              className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-gray-100 sm:hidden"
              title="Cerrar"
              aria-label="Cerrar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="relative w-full sm:max-w-md shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              aria-label="Buscar columnas"
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={`Buscar entre ${columnasVisibles.length} columnas...`}
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="hidden sm:flex text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Botones de Selección Rápida */}
        <div className="px-6 py-2.5 bg-gray-50 flex justify-between border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              const nuevoBorrador = { ...borradorColumnas };
              columnasVisibles.forEach(
                (columna) => (nuevoBorrador[columna.getColId()] = true),
              );
              setBorradorColumnas(nuevoBorrador);
            }}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Seleccionar Todas
          </button>
          <button
            type="button"
            onClick={() => {
              const nuevoBorrador = { ...borradorColumnas };
              columnasVisibles.forEach(
                (columna) => (nuevoBorrador[columna.getColId()] = false),
              );
              setBorradorColumnas(nuevoBorrador);
            }}
            className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
          >
            Ocultar Todas
          </button>
        </div>

        {/* Contenido en Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 custom-scrollbar">
          {Object.keys(clasesAgrupadas).length === 0 ? (
            <div className="text-center text-gray-500 my-10">
              No se encontraron columnas que coincidan.
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(clasesAgrupadas).map(([clase, columnas]) => (
                <div key={clase} className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b border-gray-200 pb-2">
                    {clase}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    {columnas.map((columna) => {
                      const idColumna = columna.getColId();
                      const definicionColumna = columna.getColDef();
                      const esVisible =
                        borradorColumnas[idColumna] ?? columna.isVisible();

                      return (
                        <label
                          key={idColumna}
                          className="flex items-center space-x-3 cursor-pointer group p-1 -ml-1 hover:bg-gray-100/80 rounded transition-colors"
                        >
                          <div className="relative flex items-center shrink-0">
                            <input
                              type="checkbox"
                              className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:border-blue-600 checked:bg-blue-600 transition-all hover:border-gray-400"
                              checked={esVisible}
                              onChange={(e) => {
                                setBorradorColumnas({
                                  ...borradorColumnas,
                                  [idColumna]: e.target.checked,
                                });
                              }}
                            />
                            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="1"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </div>
                          <span
                            className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors select-none truncate"
                            title={definicionColumna.headerName || idColumna}
                          >
                            {definicionColumna.headerName || idColumna}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Cancel / Save) */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (api) {
                const estadoColumnas = Object.entries(borradorColumnas).map(
                  ([idColumna, visible]) => ({
                    colId: idColumna,
                    hide: !visible,
                  }),
                );
                api.applyColumnState({
                  state: estadoColumnas,
                  applyOrder: false,
                });
                setColumnasVisibles(api.getColumns() ?? []);
              }
              onCerrar();
            }}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-marca-morado focus:ring-4 focus:ring-blue-100 transition-colors shadow-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalColumnas;
