import { mapColumnLabelsRecord } from './column-labels.mapper';

describe('mapColumnLabelsRecord', () => {
  it('mapea slots cliente y articulo desde el registro FM', () => {
    const result = mapColumnLabelsRecord({
      clienteClasificacion1: ' CANAL ',
      clienteClasificacion2: 'RUTA',
      invClasificacion1: 'LÍNEA',
      invClasificacion4: undefined,
    });

    expect(result).toEqual({
      cliente: {
        clasificacion1: 'CANAL',
        clasificacion2: 'RUTA',
        clasificacion3: '',
        clasificacion4: '',
      },
      articulo: {
        categoria1: 'LÍNEA',
        categoria2: '',
        categoria3: '',
        categoria4: '',
      },
    });
  });
});
