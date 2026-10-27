/** De qué se puede fiar el resumen ahora mismo. */
export type EstadoCifras = "primeraCarga" | "cargando" | "error" | null;

/**
 * Lo que el reporte sabe de su carga, como estado de las cifras: sin ninguna
 * carga terminada todavía no hay cifras (no $0.00); con una anterior, se
 * atenúan mientras llega la nueva.
 */
export const estadoCifras = (
  error: unknown,
  estaCargando: boolean,
  cargadoEn: Date | null,
): EstadoCifras => (error ? "error" : estaCargando ? (cargadoEn ? "cargando" : "primeraCarga") : null);
