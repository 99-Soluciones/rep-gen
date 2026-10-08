import { vi } from 'vitest';

const mockFn = vi.hoisted(() => vi.fn());

// vitest 4: async factory + await importOriginal()
vi.mock(import('./reportes.api'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    obtenerReporte: (...args: unknown[]) => mockFn(...args),
  };
});

import { obtenerReporte } from './reportes.api';

describe('vi.mock smoke test', () => {
  it('async factory + await importOriginal() should apply mock', () => {
    mockFn.mockResolvedValue([]);
    obtenerReporte({
      endpoint: 'test',
      rangoFechas: { fechaInicio: '2026-01-01', fechaFin: '2026-01-31' },
    });
    expect(mockFn).toHaveBeenCalled();
  });
});