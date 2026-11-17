import { buildBancosQuery, buildPagosQuery } from './cash-inflows.query';
import { BAN, PAGOS_VENTA } from './cash-inflows.fields';

const rango = { startDate: '2026-10-01', endDate: '2026-10-31' };

describe('cash-inflows query', () => {
  it('pagos: ventas con algún pago del portal fechado en el rango', () => {
    expect(buildPagosQuery(rango)).toEqual([
      { [PAGOS_VENTA.fecha]: '10/01/2026...10/31/2026' },
    ]);
  });

  it('bancos: abonos del rango con saldo por aplicar, por cada permiso', () => {
    const peticion = {
      [BAN.fecha]: '10/01/2026...10/31/2026',
      [BAN.abono]: '>0',
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
