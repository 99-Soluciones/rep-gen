import { cleanData } from './cash-inflows.mapper';
import pagos from './__golden__/entrada-pagos.json';
import bancos from './__golden__/entrada-bancos.json';
import rango from './__golden__/rango.json';
import esperadoFactura from './__golden__/esperado-factura.json';
import esperadoConcepto from './__golden__/esperado-concepto.json';

describe('cash-inflows cleanData — datos dorados', () => {
  it('vista por factura: produce exactamente la salida esperada', () => {
    expect(
      cleanData(pagos.response.data, bancos.response.data, rango, 'factura'),
    ).toEqual(esperadoFactura);
  });

  it('vista por concepto: produce exactamente la salida esperada', () => {
    expect(
      cleanData(pagos.response.data, bancos.response.data, rango, 'concepto'),
    ).toEqual(esperadoConcepto);
  });
});
