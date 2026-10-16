import { useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { useGridFilter, type CustomFilterProps } from "ag-grid-react";
import {
  etiquetaValor,
  modeloDesdeSeleccion,
  pasaLista,
  seleccionDesdeModelo,
  universoValores,
  type ModeloLista,
} from "../ag-grid/filtro-lista";

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Filtro de lista: buscar, "Todos / Ninguno" y una casilla por valor con su
 * cuenta. Marcar o desmarcar filtra al instante; todo marcado = sin filtro.
 * Los valores y cuentas salen de todos los registros cargados del rango (no
 * de los que dejan otros filtros) y se toman al abrir el panel.
 */
const FiltroLista = ({ model, onModelChange, api, column, getValue }: CustomFilterProps<unknown, unknown, ModeloLista>) => {
  const buscarRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const [busqueda, setBusqueda] = useState("");

  const leerUniverso = () => {
    const valores: unknown[] = [];
    api.forEachNode((nodo) => {
      if (nodo.data) valores.push(getValue(nodo));
    });
    return universoValores(valores);
  };
  const [universo, setUniverso] = useState(leerUniverso);

  useGridFilter({
    doesFilterPass: ({ node }) => pasaLista(model, getValue(node)),
    // Al abrir: valores frescos (el rango pudo cambiar) y el foco en la búsqueda.
    afterGuiAttached: () => {
      setUniverso(leerUniverso());
      setBusqueda("");
      setTimeout(() => buscarRef.current?.focus(), 0);
    },
  });

  const claves = universo.map((u) => u.valor);
  const marcados = seleccionDesdeModelo(model, claves);
  // Valores elegidos antes que ya no tienen registros en este rango: siguen a la vista.
  const fueraDelRango = model?.modo === "incluir" ? model.valores.filter((v) => !claves.includes(v)) : [];
  const filas = [
    ...universo,
    ...fueraDelRango.map((valor) => ({ valor, cuenta: 0 })),
  ].filter((f) => !busqueda || normalizar(etiquetaValor(f.valor)).includes(normalizar(busqueda)));

  const aplicar = (nuevos: Set<string>) => onModelChange(modeloDesdeSeleccion(claves, nuevos));
  const alternar = (valor: string) => {
    const nuevos = new Set(marcados);
    if (nuevos.has(valor)) nuevos.delete(valor);
    else nuevos.add(valor);
    aplicar(nuevos);
  };
  // "Todos" y "Ninguno" actúan sobre lo que muestra la búsqueda, como en Excel.
  const marcarVisibles = (marcar: boolean) => {
    const nuevos = new Set(marcados);
    for (const f of filas) {
      if (marcar) nuevos.add(f.valor);
      else nuevos.delete(f.valor);
    }
    aplicar(nuevos);
  };

  // Flechas entre casillas (Espacio ya marca o desmarca).
  const moverFoco = (evento: KeyboardEvent<HTMLUListElement>) => {
    if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") return;
    const casillas = [...(listaRef.current?.querySelectorAll<HTMLInputElement>("input[type=checkbox]") ?? [])];
    const actual = casillas.indexOf(document.activeElement as HTMLInputElement);
    const siguiente = casillas[actual + (evento.key === "ArrowDown" ? 1 : -1)];
    if (siguiente) {
      evento.preventDefault();
      siguiente.focus();
    }
  };

  const nombreColumna = column.getColDef().headerName ?? column.getColId();
  const claseAccion =
    "rounded font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <div role="dialog" aria-label={`Filtrar ${nombreColumna}`} className="flex w-64 flex-col gap-2 p-2 text-sm text-gray-900">
      <label className="relative flex items-center">
        <Search className="pointer-events-none absolute left-2 h-4 w-4 text-gray-500" aria-hidden="true" />
        <input
          ref={buscarRef}
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={`Buscar ${nombreColumna.toLowerCase()}`}
          aria-label={`Buscar en ${nombreColumna}`}
          className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </label>
      <div className="flex items-center gap-2 px-1 text-xs">
        <button type="button" className={claseAccion} onClick={() => marcarVisibles(true)}>
          Todos
        </button>
        <span aria-hidden="true" className="text-gray-400">·</span>
        <button type="button" className={claseAccion} onClick={() => marcarVisibles(false)}>
          Ninguno
        </button>
      </div>
      {filas.length === 0 ? (
        <p className="px-1 py-2 text-xs text-gray-600">
          {busqueda ? "Ningún valor coincide con la búsqueda." : "No hay valores en este rango."}
        </p>
      ) : (
        <ul ref={listaRef} onKeyDown={moverFoco} className="max-h-60 overflow-y-auto" aria-label={`Valores de ${nombreColumna}`}>
          {filas.map(({ valor, cuenta }) => (
            <li key={valor}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 pointer-coarse:min-h-10 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={marcados.has(valor)}
                  onChange={() => alternar(valor)}
                  className="h-4 w-4 shrink-0 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                <span className={`min-w-0 flex-1 truncate ${valor === "" ? "text-gray-600" : ""}`}>
                  {etiquetaValor(valor)}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-gray-600">
                  {cuenta > 0 ? cuenta.toLocaleString("es-MX") : "sin registros en este rango"}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FiltroLista;
