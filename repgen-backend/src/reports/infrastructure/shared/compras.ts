/*
 * Reglas de la compra que comparten Compras (general) y Compras por concepto.
 * Fichas: docs/reports/fichas/purchases/ y docs/reports/fichas/purchase-items/
 */
import type { EstatusCompra } from '@repgen/shared-types';
import { redondear, texto } from './fm-parsers';

/** Cerrado = liquidada; en Pagos, vencida si la fecha límite ya pasó (decisión 4 de Conceptos). */
export function estatusCompra(
  area: string,
  limite: string | null,
  hoy: string,
): EstatusCompra {
  if (area === 'Cerrado') return 'Liquidado';
  return limite && limite < hoy ? 'Vencida' : 'Vigente';
}

/** Serie-folio del CFDI; sin CFDI (UUID vacío) no hay folio. */
export const serieFolioCompra = (
  uuid: unknown,
  serie: unknown,
  folio: unknown,
): string | null => (texto(uuid) ? `${texto(serie)}-${texto(folio)}` : null);

/** Gran total en la moneda de la compra; un tipo de cambio vacío o 0 es "sin conversión". */
export const granTotalOriginal = (
  granTotalMxn: number | null,
  tipoCambio: number | null,
): number | null =>
  granTotalMxn === null ? null : redondear(granTotalMxn / (tipoCambio || 1));

const TIPOS_CONCEPTO: Record<string, string> = {
  STOCK: 'Stock',
  GASTO: 'Gasto',
  INCREMENTABLE: 'Incrementable',
  COSTO: 'Costo',
};

/** FileMaker mezcla mayúsculas (STOCK/Stock): se normaliza; un valor desconocido sale tal cual. */
export function tipoConceptoCompra(valor: unknown): string {
  const t = texto(valor);
  return TIPOS_CONCEPTO[t.toUpperCase()] ?? t;
}
