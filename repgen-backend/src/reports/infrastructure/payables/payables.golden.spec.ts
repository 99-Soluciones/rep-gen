import { cleanData } from './payables.mapper';
import facturas from './__golden__/entrada-facturas.json';
import bancos from './__golden__/entrada-bancos.json';
import corte from './__golden__/corte.json';
import esperado from './__golden__/esperado.json';
import facturas2 from './__golden__/segundo/entrada-facturas.json';
import bancos2 from './__golden__/segundo/entrada-bancos.json';
import corte2 from './__golden__/segundo/corte.json';
import esperado2 from './__golden__/segundo/esperado.json';

describe('payables cleanData — datos dorados', () => {
  it.each([
    ['principal', facturas, bancos, corte, esperado],
    ['segundo (abonos de proveedor)', facturas2, bancos2, corte2, esperado2],
  ])('%s: produce exactamente la salida esperada', (_, fac, ban, c, exp) => {
    expect(
      cleanData(fac.response.data, ban.response.data, c.fechaCorte),
    ).toEqual(exp);
  });
});
