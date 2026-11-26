import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './cash-outflows.mapper';
import pagos from './__golden__/entrada-pagos.json';
import bancos from './__golden__/entrada-bancos.json';
import rango from './__golden__/rango.json';
import esperadoFactura from './__golden__/esperado-factura.json';
import esperadoConcepto from './__golden__/esperado-concepto.json';

/** Día de la captura: el estatus de la factura es el de hoy. */
const HOY = '2026-11-26';
const P = pagos.response.data as RawRecord[];
const B = bancos.response.data as RawRecord[];

describe('cash-outflows cleanData — datos dorados', () => {
  it('vista por factura: produce exactamente la salida esperada', () => {
    expect(cleanData(P, B, rango, 'factura', HOY)).toEqual(esperadoFactura);
  });

  it('vista por concepto: produce exactamente la salida esperada', () => {
    expect(cleanData(P, B, rango, 'concepto', HOY)).toEqual(esperadoConcepto);
  });
});
