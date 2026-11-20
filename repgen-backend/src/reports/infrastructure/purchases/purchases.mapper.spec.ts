import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './purchases.mapper';
import { COMPRA, ENTREGA, MONTOS, PROVEEDOR } from './purchases.fields';

/*
 * Reglas de la ficha que los datos dorados de octubre no cubren (no hubo
 * compras en USD y el anonimizador reemplaza la cuenta contable). Parte de la
 * muestra anonimizada de la ficha: 1703 (Liquidado, varios conceptos), 1769
 * (retenciones) y 1587 (sin CFDI, en Pagos, entrega pendiente).
 */
const MUESTRA = join(
  __dirname,
  '../../../../docs/reports/fichas/purchases/Compra_ResponseFM',
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

describe('purchases cleanData — reglas de la ficha', () => {
  it('estatus: Cerrado es Liquidado; en Pagos, vencida o vigente según la fecha límite', () => {
    expect(fila(registro(1703)).facturaEstatus).toBe('Liquidado');
    const vencida = registro(1587, {
      [COMPRA.fechaLimiteDePago]: '10/30/2026',
    });
    const vigente = registro(1587, {
      [COMPRA.fechaLimiteDePago]: '10/31/2026',
    });
    expect(fila(vencida).facturaEstatus).toBe('Vencida');
    expect(fila(vigente).facturaEstatus).toBe('Vigente');
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
      [MONTOS.granTotal]: 1850,
    });
    expect(fila(r)).toMatchObject({
      facturaMoneda: 'USD',
      facturaGranTotalMxn: 1850,
      facturaGranTotalOriginal: 100,
    });
  });

  it('tipo de cambio vacío o 0: sin conversión', () => {
    const f = fila(registro(1769, { [COMPRA.tipoCambio]: 0 }));
    expect(f.facturaGranTotalOriginal).toBe(f.facturaGranTotalMxn);
  });

  it('montos de la compra tal como vienen de FileMaker', () => {
    expect(fila(registro(1769))).toMatchObject({
      importeConDescuentoMxn: 21617.3,
      ivaMxn: 3458.768,
      ivaRetenidoMxn: 270.21625,
      isrRetenidoMxn: 2305.852539,
      facturaGranTotalMxn: 22500,
    });
  });

  it('bodega y entrega tal cual; fecha estimada vacía en null', () => {
    const f = fila(registro(1769, { [ENTREGA.bodega]: 'SANS General ' }));
    expect([
      f.bodegaNombre,
      f.bodegaEntregaEstatus,
      f.bodegaFechaEstimadaDeEntrega,
    ]).toEqual(['SANS General', 'Entregado', null]);
    expect(fila(registro(1587)).bodegaFechaEstimadaDeEntrega).toBe(
      '2026-10-30',
    );
  });

  it('saltos de línea (\\r) en la cuenta contable del proveedor pasan a espacio', () => {
    const r = registro(1769, {
      [PROVEEDOR.cuentaContable]: 'Proveedor Ejemplo\rLogística del Norte',
    });
    expect(fila(r).proveedorCuentaContable).toBe(
      'Proveedor Ejemplo Logística del Norte',
    );
  });

  it('ordena por compra', () => {
    const filas = cleanData(
      [registro(1769), registro(1587), registro(1703)],
      undefined,
      HOY,
    );
    expect(filas.map((f) => f.compraId)).toEqual([1587, 1703, 1769]);
  });

  it('un registro que no cumple el schema detiene el reporte', () => {
    const r = registro(1587);
    delete r.fieldData[MONTOS.granTotal];
    expect(() => cleanData([r], undefined, HOY)).toThrow(/Compras inválido/);
  });
});
