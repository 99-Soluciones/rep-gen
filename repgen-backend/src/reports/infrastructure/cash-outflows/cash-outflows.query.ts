import type { FileMakerCondition } from '../../../filemaker/ifilemaker';
import { toFileMakerDate } from '../../../common/utils';
import type { DateRange } from '../shared/sales-utils';
import { BAN, PAGOS_COMPRA } from './cash-outflows.fields';

const rangoFm = ({ startDate, endDate }: DateRange): string =>
  `${toFileMakerDate(startDate)}...${toFileMakerDate(endDate)}`;

/**
 * Find de Pagos (ficha, paso 2): facturas de compra con algún pago fechado en
 * el rango. Se busca en el campo del portal, así que la factura llega con
 * todos sus pagos; el mapper descarta los que caen fuera del rango.
 */
export function buildPagosQuery(rango: DateRange): FileMakerCondition[] {
  return [{ [PAGOS_COMPRA.fecha]: rangoFm(rango) }];
}

/**
 * Find de Bancos (ficha, paso 2): cargos del rango con saldo por aplicar,
 * combinados con los permisos de banco del usuario.
 */
export function buildBancosQuery(
  rango: DateRange,
  permisos: FileMakerCondition[],
): FileMakerCondition[] {
  const peticion = {
    [BAN.fecha]: rangoFm(rango),
    [BAN.cargo]: '>0',
    [BAN.saldo]: '>0',
  };
  const conPermisos = permisos.length ? permisos : [{}];
  return conPermisos.map((permiso) => ({ ...peticion, ...permiso }));
}
