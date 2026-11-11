import type { FileMakerCondition } from '../../../filemaker/ifilemaker';
import { toFileMakerDate } from '../../../common/utils';
import { APLICACIONES, BAN, FAC, PAGOS_VENTA } from './receivables.fields';

/**
 * Peticiones del find de Facturas (ficha, paso 2). Cada petición une sus
 * condiciones con Y y las peticiones entre sí con O; las de omitir quitan del
 * resultado. Trae todo lo que pudo tener saldo al corte.
 */
export function buildFacturasQuery(fechaCorte: string): FileMakerCondition[] {
  const corte = toFileMakerDate(fechaCorte);
  const base = { [FAC.timbrado]: `<=${corte}`, [FAC.uuid]: '*' };
  return [
    { ...base, [FAC.saldo]: '>0' },
    { ...base, [FAC.saldo]: '<0' },
    // Las "No cobrar" conservan su saldo: entran por las peticiones de saldo.
    // Campo del portal: entra si algún pago se complementó después del corte.
    { ...base, [PAGOS_VENTA.fecha]: `>${corte}` },
    // Cancelada después del corte: la cancelación dejó su saldo de hoy en 0,
    // pero al corte sí se debía.
    {
      ...base,
      [FAC.area]: '==Cancelada',
      [FAC.cancelacion]: `>${corte} 23:59:59`,
    },
    {
      [FAC.area]: '==Cancelada',
      [FAC.cancelacion]: `<=${corte} 23:59:59`,
      omit: 'true',
    },
    { [FAC.area]: '==Cancelada', [FAC.cancelacion]: '=', omit: 'true' },
  ];
}

/**
 * Peticiones del find de Bancos (ficha, paso 2), combinadas con los permisos
 * de banco del usuario (cada permiso × cada petición).
 */
export function buildBancosQuery(
  fechaCorte: string,
  permisos: FileMakerCondition[],
): FileMakerCondition[] {
  const corte = toFileMakerDate(fechaCorte);
  const base = { [BAN.fecha]: `<=${corte}` };
  const abono = { ...base, [BAN.abono]: '>0' };
  const cargo = { ...base, [BAN.cargo]: '>0', [BAN.clienteEgreso]: '*' };
  const peticiones: FileMakerCondition[] = [
    { ...abono, [BAN.saldo]: '>0' },
    { ...abono, [BAN.saldo]: '<0' },
    { ...abono, [APLICACIONES.ingreso.fecha]: `>${corte}` },
    { ...cargo, [BAN.saldo]: '>0' },
    { ...cargo, [BAN.saldo]: '<0' },
    { ...cargo, [APLICACIONES.egreso.fecha]: `>${corte}` },
  ];
  const conPermisos = permisos.length ? permisos : [{}];
  return conPermisos.flatMap((permiso) =>
    peticiones.map((peticion) => ({ ...peticion, ...permiso })),
  );
}
