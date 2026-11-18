import { cleanData } from './bank-complements.mapper';
import entrada from './__golden__/entrada-bancos.json';
import esperado from './__golden__/esperado.json';

// rango.json (octubre 2026) solo documenta la búsqueda: el mapper no filtra por fecha.
describe('bank-complements cleanData — datos dorados', () => {
  it('produce exactamente la salida esperada', () => {
    expect(cleanData(entrada.response.data as never)).toEqual(esperado);
  });
});
