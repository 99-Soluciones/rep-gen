import { BadRequestException } from '@nestjs/common';
import {
  parseContenidoVista,
  serializeContenidoVista,
} from './report-config.mapper';

describe('contenido de la vista (campo columnState de FileMaker)', () => {
  it('lee el formato viejo (array) como solo columnas', () => {
    expect(
      parseContenidoVista(JSON.stringify([{ colId: 'a', hide: true }])),
    ).toEqual({
      columnState: [{ colId: 'a', hide: true }],
      filterModel: null,
      periodo: null,
    });
  });

  it('lee y escribe el formato nuevo con filtros y periodo', () => {
    const contenido = {
      columnState: [{ colId: 'a' }],
      filterModel: { banco: { filterType: 'text', filter: 'BBVA' } },
      periodo: 'mes_anterior' as const,
    };
    expect(parseContenidoVista(serializeContenidoVista(contenido))).toEqual(
      contenido,
    );
  });

  it('ignora periodos desconocidos, texto vacío o JSON roto', () => {
    expect(
      parseContenidoVista(
        JSON.stringify({ v: 2, columns: [], periodo: 'semana' }),
      ).periodo,
    ).toBeNull();
    expect(parseContenidoVista('').columnState).toEqual([]);
    expect(parseContenidoVista('{roto').columnState).toEqual([]);
  });

  it('guarda un modelo de filtros vacío como null', () => {
    const json = serializeContenidoVista({
      columnState: [],
      filterModel: {},
      periodo: null,
    });
    expect((JSON.parse(json) as { filters: unknown }).filters).toBeNull();
  });

  it('rechaza filtros de más de 16 KB', () => {
    expect(() =>
      serializeContenidoVista({
        columnState: [],
        filterModel: { x: { filter: 'a'.repeat(17000) } },
        periodo: null,
      }),
    ).toThrow(BadRequestException);
  });
});
