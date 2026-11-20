import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './purchase-items.mapper';
import { COMPRA, CONCEPTO, PROVEEDOR } from './purchase-items.fields';

/*
 * Reglas de la ficha que los datos dorados de octubre no cubren (no hubo
 * compras en USD, descuentos ni tipos Incrementable/Costo). Parte de la
 * muestra anonimizada de la ficha: 1703 (Stock entregado, Liquidado), 1769
 * (servicio con retenciones) y 1587 (sin CFDI, Stock pendiente, en Pagos).
 */
const MUESTRA = join(
  __dirname,
  '../../../../docs/reports/fichas/purchase-items/CompraITM_ResponseFM',
);
const HOY = '2026-10-31';

const registro = (idCompra: number, cambios: Record<string, unknown> = {}) => {
  const datos = (
    JSON.parse(readFileSync(MUESTRA, 'utf8')) as {
      response: { data: RawRecord[] };
    }
  ).response.data;
  const r = datos.find((x) => x.fieldData[COMPRA.id] === idCompra)!;
  return { ...r, fieldData: { ...r.fieldData, ...cambios } };
};
const fila = (r: RawRecord) => cleanData([r], undefined, HOY)[0];

describe('purchase-items cleanData — reglas de la ficha', () => {
  it('estatus: Cerrado es Liquidado aunque la fecha límite haya pasado', () => {
    expect(fila(registro(1703)).facturaEstatus).toBe('Liquidado');
  });

  it('estatus: en Pagos, vencida si la fecha límite es anterior a hoy', () => {
    const r = registro(1587, { [COMPRA.fechaLimiteDePago]: '10/30/2026' });
    expect(fila(r).facturaEstatus).toBe('Vencida');
  });

  it('estatus: en Pagos, vigente si la fecha límite es hoy o después', () => {
    const r = registro(1587, { [COMPRA.fechaLimiteDePago]: '10/31/2026' });
    expect(fila(r).facturaEstatus).toBe('Vigente');
  });

  it('compra sin CFDI: folio y fecha de factura en null, UUID vacío', () => {
    const f = fila(registro(1587));
    expect([f.facturaSerieFolio, f.facturaFecha, f.facturaUuid]).toEqual([
      null,
      null,
      '',
    ]);
  });

  it('compra en USD: el gran total original es MXN entre el tipo de cambio', () => {
    const r = registro(1769, {
      [COMPRA.moneda]: 'USD',
      [COMPRA.tipoCambio]: 18.5,
      [COMPRA.granTotalMxn]: 1850,
    });
    expect(fila(r)).toMatchObject({
      facturaMoneda: 'USD',
      facturaGranTotalMxn: 1850,
      facturaGranTotalOriginal: 100,
    });
  });

  it('tipo de cambio vacío o 0: sin conversión', () => {
    const r = registro(1769, { [COMPRA.tipoCambio]: 0 });
    expect(fila(r).facturaGranTotalOriginal).toBe(fila(r).facturaGranTotalMxn);
  });

  it('descuento: importes = cantidad × unitario y descuento = sin − con', () => {
    const r = registro(1587, {
      [CONCEPTO.cantidad]: 3,
      [CONCEPTO.unitSinDescuento]: 100,
      [CONCEPTO.unitConDescuento]: 90,
    });
    expect(fila(r)).toMatchObject({
      precioUnitario: 100,
      articuloImporteSinDescuentoMxn: 300,
      articuloDescuentoMontoMxn: 30,
      articuloImporteConDescuentoMxn: 270,
    });
  });

  it('montos sin ruido de punto flotante (6 decimales)', () => {
    // 3200 × 12.39 = 39648.000000000004 en punto flotante.
    expect(fila(registro(1587)).articuloImporteConDescuentoMxn).toBe(39648);
  });

  it('tipo de concepto: normaliza mayúsculas; Incrementable y Costo pasan por bodega', () => {
    const inc = fila(registro(1703, { [CONCEPTO.tipo]: 'incrementable' }));
    const costo = fila(registro(1703, { [CONCEPTO.tipo]: 'COSTO' }));
    expect([inc.tipoDeConcepto, costo.tipoDeConcepto]).toEqual([
      'Incrementable',
      'Costo',
    ]);
    expect(inc.bodegaEntregaEstatus).toBe('Entregado');
  });

  it('gasto: bodega y entrega en null aunque FileMaker traiga bodega', () => {
    const f = fila(
      registro(1769, {
        [CONCEPTO.bodega]: 'SANS General',
        [CONCEPTO.fechaEntrega]: '10/27/2026',
      }),
    );
    expect([
      f.bodegaNombre,
      f.bodegaEntregaEstatus,
      f.bodegaEntregaFecha,
    ]).toEqual([null, null, null]);
  });

  it('entrega por concepto: Stock sin fecha de recibido queda Pendiente', () => {
    const f = fila(registro(1587));
    expect([f.bodegaEntregaEstatus, f.bodegaEntregaFecha]).toEqual([
      'Pendiente',
      null,
    ]);
  });

  it('saltos de línea (\\r) en la cuenta contable del proveedor pasan a espacio', () => {
    const r = registro(1769, {
      [PROVEEDOR.cuentaContable]: 'Proveedor Ejemplo\rLogística del Norte',
    });
    expect(fila(r).proveedorCuentaContable).toBe(
      'Proveedor Ejemplo Logística del Norte',
    );
  });

  it('ordena por compra aunque FileMaker devuelva la compra partida', () => {
    const filas = cleanData(
      [registro(1769), registro(1587), registro(1703)],
      undefined,
      HOY,
    );
    expect(filas.map((f) => f.compraId)).toEqual([1587, 1703, 1769]);
  });

  it('un registro que no cumple el schema detiene el reporte', () => {
    const r = registro(1587);
    delete r.fieldData[CONCEPTO.cantidad];
    expect(() => cleanData([r], undefined, HOY)).toThrow(
      /Compras por concepto inválido/,
    );
  });
});
