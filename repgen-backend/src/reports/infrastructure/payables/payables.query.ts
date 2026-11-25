import type { FileMakerCondition } from '../../../filemaker/ifilemaker';
import { toFileMakerDate } from '../../../common/utils';
import { APLICACIONES, BAN, FAC, PAGOS_COMPRA } from './payables.fields';

/**
 * Peticiones del find de Facturas (ficha, paso 2): compras aprobadas hasta el
 * corte que pudieron deber ese día. No se filtra por saldo en Pagos: ese campo
 * no es confiable ahí (el saldo se calcula en el mapper).
 */
export function buildFacturasQuery(fechaCorte: string): FileMakerCondition[] {
  const corte = toFileMakerDate(fechaCorte);
  const base = { [FAC.aprobada]: `<=${corte}` };
  return [
    { ...base, [FAC.area]: '==Pagos' },
    // "No pagar": Cerrado con saldo (en Cerrado el campo de saldo sí cuadra).
    { ...base, [FAC.area]: '==Cerrado', [FAC.saldo]: '>0' },
    // Campo del portal: entra si algún pago se complementó después del corte.
    { ...base, [PAGOS_COMPRA.fecha]: `>${corte}` },
  ];
}

/**
 * Peticiones del find de Bancos (ficha, paso 2), combinadas con los permisos
 * de banco del usuario (cada permiso × cada petición). Los cargos van todos
 * (con o sin proveedor); los abonos, solo los de un proveedor.
 */
export function buildBancosQuery(
  fechaCorte: string,
  permisos: FileMakerCondition[],
): FileMakerCondition[] {
  const corte = toFileMakerDate(fechaCorte);
  const base = { [BAN.fecha]: `<=${corte}` };
  const cargo = { ...base, [BAN.cargo]: '>0' };
  const abono = { ...base, [BAN.abono]: '>0', [BAN.proveedorIngreso]: '*' };
  const peticiones: FileMakerCondition[] = [
    { ...cargo, [BAN.saldo]: '>0' },
    { ...cargo, [BAN.saldo]: '<0' },
    { ...cargo, [APLICACIONES.egreso.fecha]: `>${corte}` },
    { ...abono, [BAN.saldo]: '>0' },
    { ...abono, [BAN.saldo]: '<0' },
    { ...abono, [APLICACIONES.ingreso.fecha]: `>${corte}` },
  ];
  const conPermisos = permisos.length ? permisos : [{}];
  return conPermisos.flatMap((permiso) =>
    peticiones.map((peticion) => ({ ...peticion, ...permiso })),
  );
}
