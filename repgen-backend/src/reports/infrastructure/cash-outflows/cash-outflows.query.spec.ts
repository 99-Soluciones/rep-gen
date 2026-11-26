import { buildBancosQuery, buildPagosQuery } from './cash-outflows.query';
import { BAN, PAGOS_COMPRA } from './cash-outflows.fields';

const rango = { startDate: '2026-11-01', endDate: '2026-11-24' };

describe('cash-outflows query', () => {
  it('pagos: facturas con algún pago del portal fechado en el rango', () => {
    expect(buildPagosQuery(rango)).toEqual([
      { [PAGOS_COMPRA.fecha]: '11/01/2026...11/24/2026' },
    ]);
  });

  it('bancos: cargos del rango con saldo por aplicar, por cada permiso', () => {
    const peticion = {
      [BAN.fecha]: '11/01/2026...11/24/2026',
      [BAN.cargo]: '>0',
      [BAN.saldo]: '>0',
    };
    expect(
      buildBancosQuery(rango, [{ [BAN.banco]: '==BBVA' }, { _id_banco: 0 }]),
    ).toEqual([
      { ...peticion, [BAN.banco]: '==BBVA' },
      { ...peticion, _id_banco: 0 },
    ]);
  });

  it('bancos: sin permisos que combinar queda la petición sola', () => {
    expect(buildBancosQuery(rango, [])).toHaveLength(1);
  });
});
