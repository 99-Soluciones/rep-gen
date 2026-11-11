import { buildBancosQuery, buildFacturasQuery } from './receivables.query';
import { APLICACIONES, BAN, FAC, PAGOS_VENTA } from './receivables.fields';

describe('receivables query', () => {
  it('facturas: timbradas hasta el corte con saldo o pagadas después, sin canceladas antes del corte', () => {
    const q = buildFacturasQuery('2024-06-10');
    const base = { [FAC.timbrado]: '<=06/10/2024', [FAC.uuid]: '*' };
    expect(q).toEqual([
      { ...base, [FAC.saldo]: '>0' },
      { ...base, [FAC.saldo]: '<0' },
      { ...base, [PAGOS_VENTA.fecha]: '>06/10/2024' },
      {
        ...base,
        [FAC.area]: '==Cancelada',
        [FAC.cancelacion]: '>06/10/2024 23:59:59',
      },
      {
        [FAC.area]: '==Cancelada',
        [FAC.cancelacion]: '<=06/10/2024 23:59:59',
        omit: 'true',
      },
      { [FAC.area]: '==Cancelada', [FAC.cancelacion]: '=', omit: 'true' },
    ]);
  });

  it('bancos: cada permiso se combina con cada petición', () => {
    const q = buildBancosQuery('2024-06-10', [
      { [BAN.banco]: '==BBVA' },
      { _id_banco: 0 },
    ]);
    expect(q).toHaveLength(12);
    expect(q[2]).toEqual({
      [BAN.fecha]: '<=06/10/2024',
      [BAN.abono]: '>0',
      [APLICACIONES.ingreso.fecha]: '>06/10/2024',
      [BAN.banco]: '==BBVA',
    });
    expect(q[11]).toEqual({
      [BAN.fecha]: '<=06/10/2024',
      [BAN.cargo]: '>0',
      [BAN.clienteEgreso]: '*',
      [APLICACIONES.egreso.fecha]: '>06/10/2024',
      _id_banco: 0,
    });
  });

  it('bancos sin permisos: las peticiones van solas', () => {
    expect(buildBancosQuery('2024-06-10', [])).toHaveLength(6);
  });
});
