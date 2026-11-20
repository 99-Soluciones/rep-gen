import { cleanData } from './purchase-items.mapper';
import entrada from './__golden__/entrada-conceptos.json';
import esperado from './__golden__/esperado.json';
import rango from './__golden__/rango.json';

// rango.hoy fija el día con que se calcula el estatus (Vigente / Vencida).
describe('purchase-items cleanData — datos dorados', () => {
  it('produce exactamente la salida esperada', () => {
    expect(cleanData(entrada.response.data as never, rango, rango.hoy)).toEqual(
      esperado,
    );
  });
});
