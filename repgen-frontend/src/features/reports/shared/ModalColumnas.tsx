import { useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { Column } from "ag-grid-community";
import { Pin } from "lucide-react";
import type { ColumnContext } from "./ag-grid/construir-columnas";

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
  // Columnas fijas a la izquierda (se quedan a la vista al desplazarse).
  const [borradorFijadas, setBorradorFijadas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columnasVisibles.map((c) => [c.getColId(), !!c.getPinned()])),
  );
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const ningunaVisible = !Object.values(borradorColumnas).some(Boolean);
  const dialogoRef = useRef<HTMLDialogElement>(null);

  // <dialog> nativo en modo modal: atrapa el foco, cierra con Escape (evento
  // close) y deja inerte el resto de la página. jsdom no implementa showModal.
  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!abierto || !dialogo || dialogo.open) return;
    if (dialogo.showModal) dialogo.showModal();
    else dialogo.setAttribute("open", "");
  }, [abierto]);

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
    const contexto = columna.getColDef().context as ColumnContext | undefined;
    const clase = contexto?.claseColumna || "General";
    if (!clasesAgrupadas[clase]) clasesAgrupadas[clase] = [];
    clasesAgrupadas[clase].push(columna);
  });

  if (!abierto) return null;

  // close() nativo: dispara onClose (→ onCerrar) y devuelve el foco a quien
  // abrió el diálogo, el botón "Columnas". Sin él, el foco caía en <body>.
  const cerrar = () => {
    const dialogo = dialogoRef.current;
    if (dialogo?.open && typeof dialogo.close === "function") dialogo.close();
    else onCerrar();
  };
  const totalColumnas = Object.keys(borradorColumnas).length;
  const marcadas = Object.values(borradorColumnas).filter(Boolean).length;

  const api = referenciaGrid.current?.api;
  // Con búsqueda activa, "mostrar/ocultar todas" actúan solo sobre lo encontrado.
  const columnasEnLista = Object.values(clasesAgrupadas).flat();
  const sufijoLista = !textoBusqueda
    ? " todas"
    : columnasEnLista.length === 1
      ? " la encontrada"
      : ` las ${columnasEnLista.length} encontradas`;
  const sinResultados = columnasEnLista.length === 0;

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="modal-columnas-titulo"
      onClose={onCerrar}
      className="m-auto w-[calc(100%-2rem)] lg:w-[calc(100%-5rem)] max-w-5xl max-h-[90vh] p-0 bg-white rounded-xl shadow-2xl backdrop:bg-gray-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white gap-4">
          <div className="flex justify-between items-center w-full">
            {/* La cuenta va al lado, no dentro del título: el diálogo se llama "Columnas visibles". */}
            <div className="flex items-baseline gap-2">
              <h2 id="modal-columnas-titulo" className="text-xl font-bold text-gray-800">
                Columnas visibles
              </h2>
              <span className="text-sm text-gray-600 tabular-nums">
                {marcadas} de {totalColumnas}
              </span>
            </div>
            <button
              type="button"
              onClick={cerrar}
              className="text-gray-500 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-gray-100 sm:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Cerrar"
              aria-label="Cerrar"
            >
              <svg
                aria-hidden="true"
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
                aria-hidden="true"
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
            onClick={cerrar}
            className="hidden sm:flex text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <svg
              aria-hidden="true"
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
        <div className="px-6 py-2.5 bg-gray-50 flex items-center justify-between border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              const nuevoBorrador = { ...borradorColumnas };
              columnasEnLista.forEach(
                (columna) => (nuevoBorrador[columna.getColId()] = true),
              );
              setBorradorColumnas(nuevoBorrador);
            }}
            disabled={sinResultados}
            className="rounded text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Mostrar{sufijoLista}
          </button>
          <p className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
            <Pin className="h-3.5 w-3.5" aria-hidden="true" />
            fija una columna a la izquierda
          </p>
          <button
            type="button"
            onClick={() => {
              const nuevoBorrador = { ...borradorColumnas };
              columnasEnLista.forEach(
                (columna) => (nuevoBorrador[columna.getColId()] = false),
              );
              setBorradorColumnas(nuevoBorrador);
            }}
            disabled={sinResultados}
            className="rounded text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Ocultar{sufijoLista}
          </button>
        </div>

        {/* Contenido en Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          {Object.keys(clasesAgrupadas).length === 0 ? (
            <div className="text-center text-gray-500 my-10">
              Ninguna columna coincide con «{textoBusqueda}».
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(clasesAgrupadas).map(([clase, columnas]) => (
                <div key={clase} className="flex flex-col gap-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2">
                    {clase}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    {columnas.map((columna) => {
                      const idColumna = columna.getColId();
                      const definicionColumna = columna.getColDef();
                      const esVisible =
                        borradorColumnas[idColumna] ?? columna.isVisible();
                      const nombre = definicionColumna.headerName || idColumna;
                      const fijada = borradorFijadas[idColumna] ?? false;

                      return (
                        <div
                          key={idColumna}
                          className="flex items-center gap-1 -ml-1 rounded hover:bg-gray-100/80 transition-colors"
                        >
                          <label className="flex flex-1 min-w-0 items-center space-x-3 cursor-pointer group p-1">
                            <div className="relative flex items-center shrink-0">
                              <input
                                type="checkbox"
                                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:border-blue-600 checked:bg-blue-600 transition-colors hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
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
                                  aria-hidden="true"
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
                          <button
                            type="button"
                            aria-pressed={fijada}
                            aria-label={`Fijar «${nombre}» a la izquierda`}
                            title={fijada ? "Fija a la izquierda. Clic para soltarla." : "Fijar a la izquierda"}
                            onClick={() =>
                              setBorradorFijadas({ ...borradorFijadas, [idColumna]: !fijada })
                            }
                            className={`shrink-0 rounded p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              fijada
                                ? "text-blue-600 hover:text-blue-800"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                          >
                            <Pin className={`h-4 w-4 ${fijada ? "fill-current" : ""}`} aria-hidden="true" />
                          </button>
                        </div>
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
          {ningunaVisible && (
            <p role="status" className="mr-auto self-center text-sm text-gray-500">
              Deja al menos una columna visible.
            </p>
          )}
          <button
            type="button"
            onClick={cerrar}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={ningunaVisible}
            onClick={() => {
              if (api) {
                const estadoColumnas = Object.entries(borradorColumnas).map(
                  ([idColumna, visible]) => ({
                    colId: idColumna,
                    hide: !visible,
                    pinned: borradorFijadas[idColumna] ? ("left" as const) : null,
                  }),
                );
                api.applyColumnState({
                  state: estadoColumnas,
                  applyOrder: false,
                });
                setColumnasVisibles(api.getColumns() ?? []);
              }
              cerrar();
            }}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-marca-morado disabled:opacity-40 disabled:hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors shadow-sm"
          >
            Aplicar
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ModalColumnas;
