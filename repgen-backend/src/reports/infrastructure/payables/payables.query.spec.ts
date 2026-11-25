import { buildBancosQuery, buildFacturasQuery } from './payables.query';
import { APLICACIONES, BAN, FAC, PAGOS_COMPRA } from './payables.fields';

describe('payables query', () => {
  it('facturas: aprobadas hasta el corte, abiertas, "No pagar" o pagadas después', () => {
    const base = { [FAC.aprobada]: '<=07/15/2026' };
    expect(buildFacturasQuery('2026-07-15')).toEqual([
      { ...base, [FAC.area]: '==Pagos' },
      { ...base, [FAC.area]: '==Cerrado', [FAC.saldo]: '>0' },
      { ...base, [PAGOS_COMPRA.fecha]: '>07/15/2026' },
    ]);
  });

  it('bancos: cada permiso se combina con cada petición', () => {
    const q = buildBancosQuery('2026-07-15', [
      { [BAN.banco]: '==BBVA' },
      { _id_banco: 0 },
    ]);
    expect(q).toHaveLength(12);
    expect(q[2]).toEqual({
      [BAN.fecha]: '<=07/15/2026',
      [BAN.cargo]: '>0',
      [APLICACIONES.egreso.fecha]: '>07/15/2026',
      [BAN.banco]: '==BBVA',
    });
    expect(q[11]).toEqual({
      [BAN.fecha]: '<=07/15/2026',
      [BAN.abono]: '>0',
      [BAN.proveedorIngreso]: '*',
      [APLICACIONES.ingreso.fecha]: '>07/15/2026',
      _id_banco: 0,
    });
  });

  it('bancos sin permisos: las peticiones van solas', () => {
    expect(buildBancosQuery('2026-07-15', [])).toHaveLength(6);
  });
});
