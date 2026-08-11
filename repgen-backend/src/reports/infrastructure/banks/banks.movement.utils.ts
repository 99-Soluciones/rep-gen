import type { ReportBankRecord } from '../../domain/banks';

export type Movimiento = 'ingreso' | 'egreso';
export type PersonaTipo = 'CLIENTE' | 'PROV';

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

export function applyPersonaMovimientoFields(
  target: ReportBankRecord,
  source: Record<string, unknown>,
  personaTipo: PersonaTipo,
  movimiento: Movimiento,
  getString: (value: unknown) => string,
): void {
  const nombreComercialKey =
    personaTipo === 'CLIENTE'
      ? `contBanco.ITM|CLIENTE.${movimiento}|_x_bancoItmID::destLocal_dirNombreComercial`
      : `contBanco.ITM|PROV.${movimiento}|_x_bancoItmID::local_NombreComercial`;
  const rfcKey =
    personaTipo === 'CLIENTE'
      ? `contBanco.ITM|CLIENTE.${movimiento}|_x_bancoItmID::fiscal_RFC`
      : `contBanco.ITM|PROV.${movimiento}|_x_bancoItmID::fiscal_RFC`;

  target.nombre_comercial = getString(source[nombreComercialKey]);
  target.rfc = getString(source[rfcKey]);
}
