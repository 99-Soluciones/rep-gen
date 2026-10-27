import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ListFilter, X } from "lucide-react";
import type { FiltroDescrito } from "./describirFiltros";

interface TablaDinamicaControlesProps {
  totalDatos: number;
  filasVisibles: number;
  /** Filtros de columna activos (pueden estar fuera de pantalla o en columnas ocultas). */
  filtros?: FiltroDescrito[];
  onQuitarFiltro?: (colId: string) => void;
  onLimpiarFiltros?: () => void;
  /** Presente tras "Limpiar" mientras se puedan recuperar los filtros quitados. */
  onRestaurarFiltros?: () => void;
  /** La carga falló: un "0 registros" se leería como un rango sin movimientos. */
  sinRegistros?: boolean;
  /** Cargando sin nada en pantalla todavía: "0 registros" sería falso. */
  cargandoSinDatos?: boolean;
  accionesToolbarInicio?: ReactNode;
  accionesToolbar?: ReactNode;
  accionesToolbarFin?: ReactNode;
}

const ID_LISTA_FILTROS = "lista-filtros-activos";

// El endpoint siempre trae todos los registros del rango de fechas, así que el
// contador refleja lo cargado en el grid.
const TablaDinamicaControles = ({
  totalDatos,
  filasVisibles,
  filtros = [],
  onQuitarFiltro,
  onLimpiarFiltros,
  onRestaurarFiltros,
  sinRegistros = false,
  cargandoSinDatos = false,
  accionesToolbarInicio,
  accionesToolbar,
  accionesToolbarFin,
}: TablaDinamicaControlesProps) => {
  const filtrosActivos = filtros.length;
  const ocultos = filtros.filter((f) => f.oculta).length;
  // Un filtro puede estar activo aunque todavía coincidan todas las filas.
  const hayFiltroActivo = filtrosActivos > 0 || filasVisibles !== totalDatos;

  const [listaAbierta, setListaAbierta] = useState(false);
  const mostrarLista = listaAbierta && filtrosActivos > 0;
  const grupoRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  // Clic fuera cierra la lista, como cualquier menú desplegable.
  useEffect(() => {
    if (!mostrarLista) return;
    const cerrarFuera = (event: PointerEvent) => {
      if (!grupoRef.current?.contains(event.target as Node)) setListaAbierta(false);
    };
    document.addEventListener("pointerdown", cerrarFuera);
    return () => document.removeEventListener("pointerdown", cerrarFuera);
  }, [mostrarLista]);

  const textoFiltros = `${filtrosActivos} ${filtrosActivos === 1 ? "filtro" : "filtros"}`;

  return (
    // Una sola fila que se parte limpia: a la izquierda lo que se está viendo
    // (fechas, contador); a la derecha, como un bloque, lo que se puede hacer
    // (vistas, columnas, exportar). Si no cabe, el bloque baja entero y, con
    // justify-between, empieza a la izquierda bajo la primera fila (con ml-auto
    // quedaba escalonado a la derecha).
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 border-b border-gray-100 bg-white">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      {accionesToolbarInicio}
      <div
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 pointer-coarse:min-h-10 border rounded-lg text-sm whitespace-nowrap transition-colors ${
          hayFiltroActivo && !sinRegistros
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-gray-50 border-gray-200 text-gray-600"
        }`}
      >
        {hayFiltroActivo && !sinRegistros && (
          <ListFilter className="w-3.5 h-3.5 text-blue-500 shrink-0" aria-hidden="true" />
        )}
        <span aria-live="polite">
          {sinRegistros ? (
            "Sin registros cargados"
          ) : cargandoSinDatos ? (
            "Cargando registros…"
          ) : (
            <>
              <span className={`font-semibold ${hayFiltroActivo ? "text-blue-800" : "text-gray-900"}`}>
                {filasVisibles.toLocaleString("es-MX")}
              </span>
              {hayFiltroActivo && (
                <span className="text-gray-600"> de {totalDatos.toLocaleString("es-MX")}</span>
              )}{" "}
              {filasVisibles === 1 ? "registro" : "registros"}
              {filtrosActivos > 0 && <span className="sr-only"> · {textoFiltros}</span>}
            </>
          )}
        </span>
        {filtrosActivos > 0 && (
          <div
            ref={grupoRef}
            className="relative flex items-center"
            onKeyDown={(event) => {
              if (event.key !== "Escape" || !mostrarLista) return;
              event.stopPropagation();
              setListaAbierta(false);
              botonRef.current?.focus();
            }}
          >
            <span aria-hidden="true" className="text-gray-600">·&nbsp;</span>
            <button
              ref={botonRef}
              type="button"
              onClick={() => setListaAbierta((abierta) => !abierta)}
              aria-expanded={mostrarLista}
              aria-controls={ID_LISTA_FILTROS}
              className="inline-flex items-center gap-0.5 rounded font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {textoFiltros}
              {ocultos > 0 && `, ${ocultos} en columna oculta`}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${mostrarLista ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {mostrarLista && (
              <div
                id={ID_LISTA_FILTROS}
                className="absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] whitespace-normal rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg"
              >
                <ul aria-label="Filtros activos" className="py-1">
                  {filtros.map((filtro) => (
                    <li key={filtro.colId} className="flex items-start justify-between gap-2 py-1.5 pl-3 pr-1.5">
                      <div className="min-w-0 pt-1.5">
                        <p className="text-sm break-words">
                          <span className="font-medium">{filtro.columna}</span>{" "}
                          <span className="text-gray-600">{filtro.condicion}</span>
                        </p>
                        {filtro.oculta && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            Columna oculta: el filtro aplica aunque no la veas.
                          </p>
                        )}
                      </div>
                      {onQuitarFiltro && (
                        <button
                          type="button"
                          onClick={() => {
                            onQuitarFiltro(filtro.colId);
                            // El renglón desaparece: el foco no se pierde en el body.
                            botonRef.current?.focus();
                          }}
                          aria-label={`Quitar filtro de ${filtro.columna}`}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {filtrosActivos > 0 && onLimpiarFiltros && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="ml-1 inline-flex items-center pointer-coarse:min-h-10 rounded font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Limpiar
          </button>
        )}
        {filtrosActivos === 0 && onRestaurarFiltros && (
          <button
            type="button"
            onClick={onRestaurarFiltros}
            className="ml-1 inline-flex items-center pointer-coarse:min-h-10 rounded font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Restaurar filtros
          </button>
        )}
      </div>
      </div>
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
        {accionesToolbar}
        {accionesToolbarFin}
      </div>
    </div>
  );
};

export default TablaDinamicaControles;
