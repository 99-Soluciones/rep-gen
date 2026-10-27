export type Movimiento = 'ingreso' | 'egreso';

export function resolveMovimiento(
  ingresoRows: Array<Record<string, unknown>>,
  egresoRows: Array<Record<string, unknown>>,
): Movimiento | null {
  if (ingresoRows.length > 0) {
    return 'ingreso';
  }

  if (egresoRows.length > 0) {
    return 'egreso';
  }

  return null;
}
