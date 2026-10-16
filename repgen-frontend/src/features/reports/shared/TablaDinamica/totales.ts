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
  /** Aclaración bajo la etiqueta (p. ej. "No es la facturación neta"). */
  nota?: string;
}

/** Clave de la fila de totales donde viaja la nota (no es una columna). */
export const CLAVE_NOTA_TOTALES = "__notaTotales";

// Fila de totales sobre las filas visibles (después de los filtros de columna).
export function calcularFilaTotales<T>(
  api: GridApi,
  totales: TotalesTabla<T>,
): Record<string, unknown> {
  const sumas: Record<string, number> = Object.fromEntries(
    totales.campos.map((campo) => [campo, 0]),
  );
  api.forEachNodeAfterFilter((nodo) => {
    const fila = nodo.data as T;
    if (!fila || (totales.incluirFila && !totales.incluirFila(fila))) return;
    for (const campo of totales.campos) {
      sumas[campo] += Number((fila as Record<string, unknown>)[campo]) || 0;
    }
  });

  const primeraColumna = api.getAllDisplayedColumns()[0]?.getColDef().field;
  const etiqueta =
    totales.etiqueta && primeraColumna && !(primeraColumna in sumas)
      ? {
          [primeraColumna]: totales.etiqueta,
          ...(totales.nota ? { [CLAVE_NOTA_TOTALES]: totales.nota } : {}),
        }
      : {};
  return { ...sumas, ...etiqueta };
}
