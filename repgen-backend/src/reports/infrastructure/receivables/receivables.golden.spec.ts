import { cleanData } from './receivables.mapper';
import { resumirPorCliente } from './receivables-por-cliente';
import facturas from './__golden__/entrada-facturas.json';
import bancos from './__golden__/entrada-bancos.json';
import corte from './__golden__/corte.json';
import esperado from './__golden__/esperado.json';
import esperadoCliente from './__golden__/esperado-cliente.json';

describe('receivables cleanData — datos dorados', () => {
  it('produce exactamente la salida esperada', () => {
    const data = cleanData(
      facturas.response.data,
      bancos.response.data,
      corte.fechaCorte,
    );
    expect({ fechaCorte: corte.fechaCorte, data }).toEqual(esperado);
  });

  it('el resumen por cliente produce exactamente la salida esperada', () => {
    const data = cleanData(
      facturas.response.data,
      bancos.response.data,
      corte.fechaCorte,
    );
    expect({
      fechaCorte: corte.fechaCorte,
      data: resumirPorCliente(data, corte.fechaCorte),
    }).toEqual(esperadoCliente);
  });
});
