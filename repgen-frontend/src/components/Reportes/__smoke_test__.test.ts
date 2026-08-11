import { vi } from 'vitest';

const mockFn = vi.hoisted(() => vi.fn());

// vitest 4: async factory + await importOriginal()
vi.mock(import('../../services/api.reportes'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    obtenerReporte: (...args: unknown[]) => mockFn(...args),
  };
});

import { obtenerReporte } from '../../services/api.reportes';

describe('vi.mock smoke test', () => {
  it('async factory + await importOriginal() should apply mock', () => {
    mockFn.mockResolvedValue({ datos: [], totalPaginas: 1, paginaActual: 1 });
    obtenerReporte({ endpoint: 'test', pagina: 1, limite: 50 });
    expect(mockFn).toHaveBeenCalled();
  });
});