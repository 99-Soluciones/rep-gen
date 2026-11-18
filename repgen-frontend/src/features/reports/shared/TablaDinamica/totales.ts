import type { GridApi } from "ag-grid-community";

/** Columnas que suma la fila de totales; cada reporte decide cuáles tienen sentido. */
export interface TotalesTabla<T> {
  /** Campos a sumar. Nunca saldos ni montos que se repiten por renglón. */
  campos: string[];
  /** Filtra qué filas entran a la suma (p. ej. solo MXN). */
  incluirFila?: (fila: T) => boolean;
  /**
   * Texto en la primera columna visible (p. ej. "Total MXN"). Sin etiqueta no se
   * escribe nada ahí: esa columna es un dato (Venta ID, Fecha…) y un "Total"
   * en ella parece un resumen de ese campo.
   */
  etiqueta?: string;
  /**
   * Campos que se repiten en varios renglones del mismo registro (p. ej. el
   * abono de un movimiento en cada uno de sus complementos): se suman solo en
   * el primer renglón visible de cada `clave`.
   */
  unaVezPor?: { clave: (fila: T) => unknown; campos: string[] };
}

// Fila de totales sobre las filas visibles (después de los filtros de columna).
export function calcularFilaTotales<T>(
  api: GridApi,
  totales: TotalesTabla<T>,
): Record<string, unknown> {
  const unaVez = totales.unaVezPor;
  const sumas: Record<string, number> = Object.fromEntries(
    [...totales.campos, ...(unaVez?.campos ?? [])].map((campo) => [campo, 0]),
  );
  const vistas = new Set<unknown>();
  const sumar = (fila: T, campos: string[]) => {
    for (const campo of campos) {
      sumas[campo] += Number((fila as Record<string, unknown>)[campo]) || 0;
    }
  };
  api.forEachNodeAfterFilter((nodo) => {
    const fila = nodo.data as T;
    if (!fila || (totales.incluirFila && !totales.incluirFila(fila))) return;
    sumar(fila, totales.campos);
    if (unaVez && !vistas.has(unaVez.clave(fila))) {
      vistas.add(unaVez.clave(fila));
      sumar(fila, unaVez.campos);
    }
  });

  const primeraColumna = api.getAllDisplayedColumns()[0]?.getColDef().field;
  const etiqueta =
    totales.etiqueta && primeraColumna && !(primeraColumna in sumas)
      ? { [primeraColumna]: totales.etiqueta }
      : {};
  return { ...sumas, ...etiqueta };
}
