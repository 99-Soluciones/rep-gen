import type { GridApi } from "ag-grid-community";
import type { PeriodoVista } from "@repgen/shared-types";
import type { ColumnStateEntry, ReportConfigResponse } from "../api/report-configs.api";
import { envolverTextoLegado } from "../ag-grid/filtro-lista";

/**
 * Una vista guardada es una "pregunta guardada": columnas + filtros de AG Grid
 * + (opcional) un periodo relativo que se resuelve a fechas al abrirla.
 */

export interface Rango {
  desde: string;
  hasta: string;
}

export const PERIODOS: { valor: PeriodoVista; etiqueta: string }[] = [
  { valor: "mes_actual", etiqueta: "Mes actual" },
  { valor: "mes_anterior", etiqueta: "Mes anterior" },
  { valor: "anio_en_curso", etiqueta: "Año en curso" },
];

// YYYY-MM-DD en hora local (no UTC), igual que el resto de las fechas de la app.
const iso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
    fecha.getDate(),
  ).padStart(2, "0")}`;

/** Resuelve un periodo a fechas. "Mes anterior" = día 1 al último día; los demás terminan hoy. */
export const resolverPeriodo = (periodo: PeriodoVista, hoy = new Date()): Rango => {
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  switch (periodo) {
    case "mes_actual":
      return { desde: iso(new Date(anio, mes, 1)), hasta: iso(hoy) };
    case "mes_anterior":
      return { desde: iso(new Date(anio, mes - 1, 1)), hasta: iso(new Date(anio, mes, 0)) };
    case "anio_en_curso":
      return { desde: iso(new Date(anio, 0, 1)), hasta: iso(hoy) };
  }
};

/** Periodo cuyo rango coincide exactamente con el dado, o null. */
export const detectarPeriodo = (rango: Rango, hoy = new Date()): PeriodoVista | null =>
  PERIODOS.find(({ valor }) => {
    const r = resolverPeriodo(valor, hoy);
    return r.desde === rango.desde && r.hasta === rango.hasta;
  })?.valor ?? null;

export type VistaCapturada = ReturnType<typeof capturarVista>;

export const capturarVista = (api: GridApi) => {
  const filtros = api.getFilterModel();
  return {
    columnState: api.getColumnState() as ColumnStateEntry[],
    filterModel: Object.keys(filtros).length > 0 ? filtros : null,
  };
};

/** Aplica columnas y filtros. Claves de columnas que ya no existen se ignoran. */
export const aplicarVista = (
  api: GridApi,
  vista: Pick<ReportConfigResponse, "columnState" | "filterModel">,
) => {
  api.applyColumnState({ state: vista.columnState, applyOrder: true });
  const columnas = new Map((api.getColumns() ?? []).map((c) => [c.getColId(), c]));
  const filtros = Object.fromEntries(
    Object.entries(vista.filterModel ?? {})
      .filter(([colId]) => columnas.has(colId))
      .map(([colId, modelo]) => {
        // Un filtro de texto guardado cuando la columna aún no era lista: se
        // respeta tal cual (la lista lo muestra marcado) en vez de perderse.
        const esLista = (columnas.get(colId)?.getColDef().context as { filtroLista?: boolean } | undefined)
          ?.filtroLista;
        const deTexto = (modelo as { filterType?: string } | null)?.filterType === "text";
        return [colId, esLista && deTexto ? envolverTextoLegado(modelo as object) : modelo];
      }),
  );
  api.setFilterModel(Object.keys(filtros).length > 0 ? filtros : null);
};

/** "— Ninguna —": columnas originales del reporte (orden y visibilidad del esquema), sin filtros. */
export const restaurarOriginal = (api: GridApi) => {
  api.resetColumnState();
  api.setFilterModel(null);
};

// JSON con claves ordenadas: dos modelos de filtros iguales dan el mismo texto.
const estable = (valor: unknown): string => {
  if (Array.isArray(valor)) return `[${valor.map(estable).join(",")}]`;
  if (valor && typeof valor === "object") {
    return `{${Object.keys(valor)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${estable((valor as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(valor ?? null);
};

/**
 * Huella de lo que el usuario considera "la vista": visibilidad, orden, orden
 * de clasificación, columnas fijas y filtros. El ancho no cuenta: el grid lo
 * recalcula al redimensionar la ventana.
 */
export const huellaVista = (
  columnState: ColumnStateEntry[],
  filterModel: Record<string, unknown> | null | undefined,
) =>
  estable({
    columnas: columnState.map(({ colId, hide, sort, sortIndex, pinned }) => ({
      colId,
      hide: Boolean(hide),
      sort: sort ?? null,
      sortIndex: sort ? (sortIndex ?? null) : null,
      pinned: pinned ?? null,
    })),
    filtros: filterModel && Object.keys(filterModel).length > 0 ? filterModel : null,
  });
