import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './cash-inflows.mapper';
import { BAN, CONCEPTOS, PAGOS_VENTA, VEN } from './cash-inflows.fields';
import pagos from './__golden__/entrada-pagos.json';
import bancos from './__golden__/entrada-bancos.json';

/*
 * Reglas de la ficha que los datos dorados no cubren. Cada caso parte de un
 * registro real (anonimizado) y le cambia solo lo que la regla necesita.
 */

const rango = { startDate: '2026-10-01', endDate: '2026-10-31' };
const copia = <T>(v: T): T => structuredClone(v);

/** F-3111: $3,000, un pago de $3,000 el 08/10/2026, tres conceptos. */
const venta = (): RawRecord & {
  portalData: Record<string, Record<string, unknown>[]>;
} =>
  copia(
    pagos.response.data.find((r) => r.fieldData.__id_venta === 3476),
  ) as never;
/** Depósito no identificado del 02/10/2026 con saldo $5,738.54. */
const deposito = (): RawRecord =>
  copia(
    bancos.response.data.find((r) => r.fieldData.__id_bancoITM === 7357),
  ) as never;

const porFactura = (v: RawRecord[], b: RawRecord[] = [], r = rango) =>
  cleanData(v, b, r, 'factura');

describe('cash-inflows cleanData — reglas', () => {
  it('nota de crédito (folio de banco 0 o vacío): no sale', () => {
    for (const folio of [0, '']) {
      const v = venta();
      v.portalData.PagosVenta[0][PAGOS_VENTA.bancoFolio] = folio;
      expect(porFactura([v])).toEqual([]);
    }
  });

  it('el rango incluye el primer y el último día', () => {
    const v = venta();
    const pago = v.portalData.PagosVenta[0];
    v.portalData.PagosVenta = [
      { ...pago, [PAGOS_VENTA.fecha]: '09/30/2026' },
      { ...pago, [PAGOS_VENTA.fecha]: '10/01/2026' },
      { ...pago, [PAGOS_VENTA.fecha]: '10/31/2026' },
      { ...pago, [PAGOS_VENTA.fecha]: '11/01/2026' },
    ];
    expect(porFactura([v]).map((f) => f.pagoFecha)).toEqual([
      '2026-10-01',
      '2026-10-31',
    ]);
  });

  it('factura cancelada con pago en el rango: sale con estatus Cancelada', () => {
    const v = venta();
    v.fieldData[VEN.area] = 'Cancelada';
    const [fila] = porFactura([v]);
    expect(fila.facturaEstatus).toBe('Cancelada');
    expect(fila.pagoGranTotalMxn).toBe(3000);
  });

  it('factura en dólares: montos en MXN y el gran total original con su tipo de cambio', () => {
    const v = venta();
    v.fieldData[VEN.moneda] = 'USD';
    v.fieldData[VEN.tipoCambio] = 20;
    v.portalData.PagosVenta[0][PAGOS_VENTA.bancoMoneda] = 'USD';
    v.portalData.PagosVenta[0][PAGOS_VENTA.bancoTipoCambio] = 19.5;
    const [fila] = porFactura([v]);
    expect(fila).toMatchObject({
      facturaMoneda: 'USD',
      facturaTipoDeCambio: 20,
      facturaGranTotalMxn: 3000,
      facturaGranTotalOriginal: 150,
      bancoMoneda: 'USD',
      bancoTipoDeCambio: 19.5,
      pagoGranTotalMxn: 3000,
    });
  });

  it('abono parcial: importes y costo prorrateados, y el desglose da el pago', () => {
    const v = venta();
    v.portalData.PagosVenta[0][PAGOS_VENTA.montoMxn] = 1000;
    const [fila] = porFactura([v]);
    expect(fila.pagoTasa).toBe(0.333333);
    expect(fila.facturaGranTotalMxn).toBe(3000);
    expect(
      fila.importeConDescuentoMxn! +
        fila.ivaMxn! +
        fila.iepsMxn! -
        fila.ivaRetenidoMxn! -
        fila.isrRetenidoMxn!,
    ).toBeCloseTo(1000, 1);

    const conceptos = cleanData([v], [], rango, 'concepto');
    expect(conceptos).toHaveLength(3);
    expect(conceptos.reduce((s, c) => s + c.pagoGranTotalMxn, 0)).toBeCloseTo(
      1000,
      1,
    );
    // La cantidad es la del concepto completo, no se prorratea.
    expect(conceptos.map((c) => c.cantidad)).toEqual([36, 24, 12]);
  });

  it('fecha de captura en las dos vistas; presentación solo por concepto', () => {
    const v = venta();
    v.fieldData[VEN.fechaCaptura] = '09/20/2026 10:15:00';
    v.portalData.Conceptos[0][CONCEPTOS.presentacion] = ' Botella .355 ml ';

    const [factura] = porFactura([v]);
    expect(factura.facturaFechaDeCaptura).toBe('2026-09-20');
    expect(factura.articuloPresentacion).toBeNull();

    const [concepto] = cleanData([v], [], rango, 'concepto');
    expect(concepto.facturaFechaDeCaptura).toBe('2026-09-20');
    expect(concepto.articuloPresentacion).toBe('Botella .355 ml');
  });

  it('factura con gran total 0: no divide entre cero', () => {
    const v = venta();
    v.fieldData[VEN.granTotal] = 0;
    const [fila] = porFactura([v]);
    expect(fila.pagoTasa).toBe(0);
    expect(fila.costoTasa).toBeNull();
    expect(fila.margenTasa).toBeNull();
  });

  it('depósito en dólares sin aplicar: saldo convertido a MXN', () => {
    const d = deposito();
    d.fieldData[BAN.saldo] = 100;
    d.fieldData[BAN.tipoCambio] = 18.5;
    const [fila] = porFactura([], [d]);
    expect(fila).toMatchObject({
      tipoRenglon: 'Pago no identificado',
      pagoGranTotalMxn: 1850,
      bancoTipoDeCambio: 18.5,
    });
  });

  it('depósito ya aplicado (saldo 0), cargo, o fuera del rango: no sale', () => {
    const aplicado = deposito();
    aplicado.fieldData[BAN.saldo] = 0;
    const cargo = deposito();
    cargo.fieldData[BAN.abono] = '';
    const fuera = deposito();
    fuera.fieldData[BAN.fecha] = '11/01/2026';
    expect(porFactura([], [aplicado, cargo, fuera])).toEqual([]);
  });

  it('un registro sin un campo del layout lanza (el endpoint responde 500)', () => {
    const v = venta();
    delete v.fieldData[VEN.granTotal];
    expect(() => porFactura([v])).toThrow(/Registro de Ingresos inválido/);
  });
});
