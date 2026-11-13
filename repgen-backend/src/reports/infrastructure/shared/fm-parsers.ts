/*
 * Lectura de valores crudos de FileMaker para reportes con datos dorados.
 * A diferencia de TypeGetters, lo vacío es null (no 0 ni ''): "sin dato" y
 * "cero" no son lo mismo en un reporte.
 */

/** MM/DD/YYYY o "MM/DD/YYYY HH:MM:SS" de FileMaker -> YYYY-MM-DD; vacío -> null. */
export function fecha(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const [m, d, y] = valor.trim().split(' ')[0].split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Número de FileMaker; vacío o no numérico -> null. */
export function numero(valor: unknown): number | null {
  if (valor === '' || valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isNaN(n) ? null : n;
}

/** Id de FileMaker: vacío o 0 significa "sin registro". */
export function id(valor: unknown): number | null {
  const n = numero(valor);
  return n ? Math.trunc(n) : null;
}

/** Texto recortado; FileMaker puede mandar un número en un campo de texto. */
export function texto(valor: unknown): string {
  if (typeof valor === 'string') return valor.trim();
  return typeof valor === 'number' ? String(valor) : '';
}

/** Redondeo a 2 decimales (montos). */
export const redondear = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;
