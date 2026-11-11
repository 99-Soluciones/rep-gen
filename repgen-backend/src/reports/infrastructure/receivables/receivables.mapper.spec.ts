import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './receivables.mapper';
import {
  APLICACIONES,
  BAN,
  FAC,
  PAGOS_VENTA,
  banCliente,
} from './receivables.fields';

// Casos que el primer juego de datos dorados no cubre.

const factura = (campos: Record<string, unknown>, pagos: unknown[] = []) =>
  ({
    recordId: '1',
    fieldData: {
      [FAC.ventaId]: 1,
      [FAC.timbrado]: '05/01/2024',
      [FAC.uuid]: 'UUID-1',
      [FAC.saldo]: 100,
      [FAC.fechaLimite]: '05/31/2024',
      [FAC.area]: 'Repartos',
      [FAC.cancelacion]: '',
      [FAC.estatusSaldo]: 'Pendiente',
      [FAC.fechaNoCobrar]: '',
      ...campos,
    },
    portalData: { [PAGOS_VENTA.portal]: pagos },
  }) as unknown as RawRecord;

const banco = (
  campos: Record<string, unknown>,
  portal: Record<string, unknown[]> = {},
) =>
  ({
    recordId: '2',
    fieldData: {
      [BAN.folio]: 7,
      [BAN.fecha]: '05/01/2024',
      [BAN.abono]: '',
      [BAN.cargo]: '',
      [BAN.saldo]: 0,
      [BAN.tipoCambio]: 1,
      ...campos,
    },
    portalData: portal,
  }) as unknown as RawRecord;

const CORTE = '2024-06-10';

describe('receivables cleanData — casos puntuales', () => {
  it('factura cancelada después del corte sale; antes del corte o sin fecha no', () => {
    const filas = cleanData(
      [
        factura({
          [FAC.ventaId]: 1,
          [FAC.area]: 'Cancelada',
          [FAC.cancelacion]: '06/11/2024 09:00:00',
          [FAC.saldo]: 0,
          [FAC.granTotal]: 100,
        }),
        factura({
          [FAC.ventaId]: 2,
          [FAC.area]: 'Cancelada',
          [FAC.cancelacion]: '06/10/2024 18:00:00',
        }),
        factura({
          [FAC.ventaId]: 3,
          [FAC.area]: 'Cancelada',
          [FAC.cancelacion]: '',
        }),
      ],
      [],
      CORTE,
    );
    expect(filas.map((f) => f.ventaId)).toEqual([1]);
  });

  it('cancelada después del corte: saldo = gran total − pagos hasta el corte (su saldo de hoy es 0)', () => {
    const [fila] = cleanData(
      [
        factura(
          {
            [FAC.area]: 'Cancelada',
            [FAC.cancelacion]: '10/27/2024 12:00:00',
            [FAC.saldo]: 0,
            [FAC.granTotal]: 1920,
          },
          [
            { [PAGOS_VENTA.montoMxn]: 500, [PAGOS_VENTA.fecha]: '06/01/2024' },
            { [PAGOS_VENTA.montoMxn]: 300, [PAGOS_VENTA.fecha]: '06/20/2024' },
          ],
        ),
      ],
      [],
      CORTE,
    );
    expect(fila.facturaSaldoPendiente).toBe(1420);
    expect(fila.facturaGranTotal).toBe(1920);
  });

  it('factura timbrada después del corte o sin UUID no sale', () => {
    const filas = cleanData(
      [
        factura({ [FAC.ventaId]: 1, [FAC.timbrado]: '06/11/2024' }),
        factura({ [FAC.ventaId]: 2, [FAC.uuid]: '' }),
      ],
      [],
      CORTE,
    );
    expect(filas).toEqual([]);
  });

  it('suma los pagos posteriores al corte y no los del mismo día', () => {
    const [fila] = cleanData(
      [
        factura({ [FAC.saldo]: 0 }, [
          { [PAGOS_VENTA.montoMxn]: 30, [PAGOS_VENTA.fecha]: '06/10/2024' },
          { [PAGOS_VENTA.montoMxn]: 70, [PAGOS_VENTA.fecha]: '06/11/2024' },
        ]),
      ],
      [],
      CORTE,
    );
    expect(fila.facturaSaldoPendiente).toBe(70);
    expect(fila.facturaDiasVencida).toBe(10);
  });

  it('vencimiento vacío: fecha + días de crédito', () => {
    const [fila] = cleanData(
      [factura({ [FAC.fechaLimite]: '', [FAC.diasCredito]: 45 })],
      [],
      CORTE,
    );
    expect(fila.facturaFechaVencimiento).toBe('2024-06-15');
    expect(fila.tipoTransaccion).toBe('Factura por vencer');
  });

  it('abono sin cliente con saldo: no identificado', () => {
    const [fila] = cleanData(
      [],
      [banco({ [BAN.abono]: 500, [BAN.saldo]: 500 })],
      CORTE,
    );
    expect(fila).toMatchObject({
      tipoTransaccion: 'Abono no identificado',
      cliente: 'SIN IDENTIFICAR',
      abonoMontoSinIdentificar: 500,
      clienteId: null,
    });
  });

  it('abono en dólares: saldo en moneda original pasado a MXN con el TC del depósito', () => {
    const [fila] = cleanData(
      [],
      [
        banco(
          {
            [BAN.abono]: 100,
            [BAN.saldo]: 20,
            [BAN.tipoCambio]: 18,
            [BAN.clienteIngreso]: 5,
          },
          {
            [APLICACIONES.ingreso.portal]: [
              {
                [APLICACIONES.ingreso.montoMxn]: 570,
                [APLICACIONES.ingreso.tipoCambio]: 19,
                [APLICACIONES.ingreso.fecha]: '07/01/2024',
              },
            ],
          },
        ),
      ],
      CORTE,
    );
    // (20 USD de hoy + 570/19 = 30 USD aplicados después) × 18
    expect(fila.abonoSaldoNoAplicado).toBe(900);
    expect(fila.bancoMonto).toBe(1800);
  });

  describe('abono con ingreso menor que el depósito (comparación con el ERP)', () => {
    const abono = (campos: Record<string, unknown>) =>
      banco({ [BAN.clienteIngreso]: 5, [BAN.ingresoId]: 77, ...campos });

    it('se divide: por aplicar = ingreso − aplicado; no identificado = banco − ingreso', () => {
      // REVUELTA QUEER HOUSE: depósito 984, ingreso 960, aplicado 24.
      const filas = cleanData(
        [],
        [
          abono({
            [BAN.abono]: 984,
            [BAN.saldo]: 960,
            [BAN.montoIngreso]: 960,
          }),
        ],
        CORTE,
      );
      expect(
        filas.map((f) => [
          f.tipoTransaccion,
          f.abonoSaldoNoAplicado,
          f.abonoMontoSinIdentificar,
          f.bancoMonto,
        ]),
      ).toEqual([
        ['Abono por aplicar', 936, null, 984],
        ['Abono no identificado', null, 24, 984],
      ]);
    });

    it('ingreso ya aplicado completo: todo el saldo es no identificado', () => {
      const filas = cleanData(
        [],
        [
          abono({
            [BAN.abono]: 1867.93,
            [BAN.saldo]: 357,
            [BAN.montoIngreso]: 1510.93,
          }),
        ],
        CORTE,
      );
      expect(filas.map((f) => f.tipoTransaccion)).toEqual([
        'Abono no identificado',
      ]);
      expect(filas[0].abonoMontoSinIdentificar).toBe(357);
    });

    it('sin monto de ingreso o con saldo negativo no se divide', () => {
      const filas = cleanData(
        [],
        [
          abono({ [BAN.folio]: 1, [BAN.abono]: 984, [BAN.saldo]: 960 }),
          abono({
            [BAN.folio]: 2,
            [BAN.abono]: 3535.39,
            [BAN.saldo]: -1178.47,
            [BAN.montoIngreso]: 3535.39,
          }),
        ],
        CORTE,
      );
      expect(filas.map((f) => f.abonoSaldoNoAplicado)).toEqual([960, -1178.47]);
    });

    it('cargo con egreso menor que el movimiento: solo sale la parte del cliente', () => {
      const filas = cleanData(
        [],
        [
          banco({
            [BAN.cargo]: 300,
            [BAN.saldo]: 300,
            [BAN.clienteEgreso]: 9,
            [BAN.montoEgreso]: 250,
          }),
        ],
        CORTE,
      );
      expect(
        filas.map((f) => [f.tipoTransaccion, f.cargoSaldoNoAplicado]),
      ).toEqual([['Cargo por aplicar', 250]]);
    });
  });

  it('cargo con cliente: cargo por aplicar con los datos del cliente del egreso', () => {
    const c = banCliente('egreso');
    const [fila] = cleanData(
      [],
      [
        banco({
          [BAN.cargo]: 250,
          [BAN.saldo]: 250,
          [BAN.clienteEgreso]: 9,
          [BAN.egresoId]: 44,
          [c.id]: 9,
          [c.nombre]: 'Cliente Devolución ',
        }),
        banco({ [BAN.folio]: 8, [BAN.cargo]: 99, [BAN.saldo]: 99 }),
      ],
      CORTE,
    );
    expect(fila).toMatchObject({
      tipoTransaccion: 'Cargo por aplicar',
      cargoSaldoNoAplicado: 250,
      egresoId: 44,
      clienteId: 9,
      cliente: 'Cliente Devolución',
    });
  });

  it('No cobrar: su saldo va a No Cobrar Gran Total si al corte ya estaba marcada', () => {
    const filas = cleanData(
      [
        factura({
          [FAC.ventaId]: 1,
          [FAC.estatusSaldo]: 'NoCobrar',
          [FAC.fechaNoCobrar]: '06/01/2024',
          [FAC.noCobrarIva]: 13.79,
          [FAC.noCobrarIeps]: '',
        }),
        factura({
          [FAC.ventaId]: 2,
          [FAC.estatusSaldo]: 'NoCobrar',
          [FAC.fechaNoCobrar]: '',
        }),
        factura({
          [FAC.ventaId]: 3,
          [FAC.estatusSaldo]: 'NoCobrar',
          [FAC.fechaNoCobrar]: '06/11/2024',
          [FAC.noCobrarIva]: 13.79,
        }),
      ],
      [],
      CORTE,
    );
    expect(
      filas.map((f) => [
        f.ventaId,
        f.tipoTransaccion,
        f.facturaEstatus,
        f.facturaSaldoPendiente,
        f.facturaSaldoVencido,
        f.facturaNoCobrarGranTotal,
        f.facturaNoCobrarIva,
        f.facturaNoCobrarIeps,
        f.facturaNoCobrarFecha,
      ]),
    ).toEqual([
      // Marcada después del corte: ese día era una factura normal.
      [3, 'Factura vencida', 'Vencida', 100, 100, 0, 0, 0, null],
      [
        1,
        'Factura cerrada: No cobrar',
        'No cobrar',
        0,
        0,
        100,
        13.79,
        0,
        '2024-06-01',
      ],
      [2, 'Factura cerrada: No cobrar', 'No cobrar', 0, 0, 100, 0, 0, null],
    ]);
    expect(filas.every((f) => f.fechaCorte === CORTE)).toBe(true);
  });

  it('un registro que no cumple el schema lanza error', () => {
    const sinPortal = {
      recordId: '1',
      fieldData: { [FAC.ventaId]: 1 },
    } as RawRecord;
    expect(() => cleanData([sinPortal], [], CORTE)).toThrow(
      'Registro de CxC inválido',
    );
  });
});
