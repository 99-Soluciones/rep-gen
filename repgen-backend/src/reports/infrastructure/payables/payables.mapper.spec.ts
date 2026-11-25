import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './payables.mapper';
import { APLICACIONES, BAN, FAC, PAGOS_COMPRA } from './payables.fields';

// Casos de la ficha sin dato en SANS (los demás están en los datos dorados).
const CORTE = '2026-07-15';

const compra = (
  campos: Record<string, unknown>,
  pagos: [number, string][] = [],
  recordId = '1',
): RawRecord => ({
  recordId,
  fieldData: {
    [FAC.compraId]: 10,
    [FAC.aprobada]: '06/01/2026',
    [FAC.area]: 'Pagos',
    [FAC.granTotal]: 1000,
    [FAC.pagado]: 0,
    [FAC.fechaLimite]: '07/01/2026',
    [FAC.uuid]: '',
    ...campos,
  },
  portalData: {
    [PAGOS_COMPRA.portal]: pagos.map(([monto, f]) => ({
      [PAGOS_COMPRA.montoMxn]: monto,
      [PAGOS_COMPRA.fecha]: f,
    })),
  },
});

const movimiento = (
  campos: Record<string, unknown>,
  aplicaciones: [number, string][] = [],
): RawRecord => ({
  recordId: '1',
  fieldData: {
    [BAN.folio]: 500,
    [BAN.fecha]: '06/10/2026',
    [BAN.tipoCambio]: 1,
    ...campos,
  },
  portalData: {
    [APLICACIONES.egreso.portal]: aplicaciones.map(([monto, f]) => ({
      [APLICACIONES.egreso.montoMxn]: monto,
      [APLICACIONES.egreso.tipoCambio]: 1,
      [APLICACIONES.egreso.fecha]: f,
    })),
  },
});

describe('payables cleanData', () => {
  it('compra en USD: gran total original = MXN / TC', () => {
    const [fila] = cleanData(
      [
        compra({
          [FAC.moneda]: 'USD',
          [FAC.tipoCambio]: 18,
          [FAC.granTotal]: 1800,
        }),
      ],
      [],
      CORTE,
    );
    expect(fila.facturaGranTotalOriginal).toBe(100);
    expect(fila.facturaSaldoVencido).toBe(1800);
  });

  it('un pago antes y otro después del corte: solo resta el de antes', () => {
    const [fila] = cleanData(
      [
        compra({ [FAC.area]: 'Cerrado', [FAC.pagado]: 1000 }, [
          [300, '07/10/2026'],
          [700, '07/20/2026'],
        ]),
      ],
      [],
      CORTE,
    );
    expect(fila.tipoTransaccion).toBe('Factura vencida');
    expect(fila.facturaSaldoPendiente).toBe(700);
  });

  it('sin fecha límite: vence desde la aprobación', () => {
    const [fila] = cleanData([compra({ [FAC.fechaLimite]: '' })], [], CORTE);
    expect(fila.facturaFechaLimiteDePago).toBe('2026-06-01');
    expect(fila.facturaDiasVencida).toBe(44);
  });

  it('"No pagar" marcada después del corte sale como factura normal', () => {
    const [fila] = cleanData(
      [
        compra({
          [FAC.area]: 'Cerrado',
          [FAC.fechaCerrado]: '07/20/2026',
          [FAC.cerradaPor]: 'Usuario',
        }),
      ],
      [],
      CORTE,
    );
    expect(fila.tipoTransaccion).toBe('Factura vencida');
    expect(fila.facturaNoPagarCerradaPor).toBeNull();
  });

  it('dos facturas de la misma OC y misma fecha límite: desempata el recordId', () => {
    const filas = cleanData(
      [
        compra({ [FAC.granTotal]: 2 }, [], '20'),
        compra({ [FAC.granTotal]: 1 }, [], '3'),
      ],
      [],
      CORTE,
    );
    expect(filas.map((f) => f.facturaGranTotal)).toEqual([1, 2]);
  });

  it('cargo con cliente en el egreso: es de CxC y no sale', () => {
    const filas = cleanData(
      [],
      [
        movimiento({
          [BAN.cargo]: 100,
          [BAN.saldo]: 100,
          [BAN.clienteEgreso]: 7,
        }),
      ],
      CORTE,
    );
    expect(filas).toEqual([]);
  });

  it('egreso menor que el cargo: el sobrante sale como no identificado', () => {
    const filas = cleanData(
      [],
      [
        movimiento({
          [BAN.cargo]: 1000,
          [BAN.saldo]: 300,
          [BAN.proveedorEgreso]: 4,
          [BAN.montoEgreso]: 900,
        }),
      ],
      CORTE,
    );
    expect(
      filas.map((f) => [
        f.tipoTransaccion,
        f.cargoSaldoNoAplicado ?? f.cargoMontoSinIdentificar,
      ]),
    ).toEqual([
      ['Cargo por aplicar', 200],
      ['Cargo no identificado', 100],
    ]);
  });

  it('un registro sin su id responde con error de schema', () => {
    expect(() =>
      cleanData([{ recordId: '1', fieldData: {}, portalData: {} }], [], CORTE),
    ).toThrow('Registro de CxP inválido');
  });
});
