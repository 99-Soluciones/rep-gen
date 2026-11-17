import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Cache } from '@nestjs/cache-manager';
import type { FileMakerService } from '../../../filemaker/filemaker.service';
import type { GetBankPermissionsUseCase } from '../../../user/application';
import type { LoggerService } from '../../../common/logger';
import { GetCashInflowsReportUseCase } from './get-cash-inflows-report.use-case';

const vacio = { response: { data: [], dataInfo: { foundCount: 0 } } };
const rango = { startDate: '2026-10-01', endDate: '2026-10-31' };

describe('GetCashInflowsReportUseCase', () => {
  const make = (findImpl = jest.fn().mockResolvedValue(vacio)) => {
    const store = new Map<string, unknown>();
    const cache = {
      get: (k: string) => Promise.resolve(store.get(k)),
      set: (k: string, v: unknown) => {
        store.set(k, v);
        return Promise.resolve();
      },
    } as unknown as Cache;
    const permisos = {
      getBankPermissions: jest.fn().mockResolvedValue({ banksNames: ['BBVA'] }),
    } as unknown as GetBankPermissionsUseCase;
    const logger = {
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as LoggerService;
    const fm = { findRecords: findImpl } as unknown as FileMakerService;
    return {
      useCase: new GetCashInflowsReportUseCase(fm, cache, permisos, logger),
      findImpl,
    };
  };

  it('consulta los dos layouts por la sesión de reportes, con los portales de pagos completos', async () => {
    const { useCase, findImpl } = make();
    const res = await useCase.fetchReport(rango, 'factura', 'db', 1);

    expect(res).toEqual({ data: [] });
    const calls = findImpl.mock.calls as unknown[][];
    expect(calls.map((c) => c[1])).toEqual([
      'apiExport_Ingresos_Pagos',
      'apiExport_Ingresos_Bancos',
    ]);
    expect(calls.every((c) => c[5] === 'reportes')).toBe(true);
    expect(Object.keys(calls[0][6] as object)).toEqual([
      'PagosVenta',
      'Conceptos',
    ]);
    // Los depósitos se filtran por los bancos que el usuario puede ver.
    expect(JSON.stringify(calls[1][2])).toContain('==BBVA');
  });

  it('las dos vistas del mismo rango comparten una sola consulta a FileMaker', async () => {
    const { useCase, findImpl } = make();
    await useCase.fetchReport(rango, 'factura', 'db', 1);
    await useCase.fetchReport(rango, 'concepto', 'db', 1);
    expect(findImpl).toHaveBeenCalledTimes(2);

    await useCase.fetchReport(rango, 'factura', 'db', 1, true);
    expect(findImpl).toHaveBeenCalledTimes(4);
  });

  it('rechaza un rango invertido', async () => {
    const { useCase } = make();
    await expect(
      useCase.fetchReport(
        { startDate: '2026-10-31', endDate: '2026-10-01' },
        'factura',
        'db',
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('un registro con formato inesperado responde 500', async () => {
    const malo = {
      response: {
        data: [{ fieldData: {}, portalData: {}, recordId: '1' }],
        dataInfo: { foundCount: 1 },
      },
    };
    const { useCase } = make(jest.fn().mockResolvedValue(malo));
    await expect(
      useCase.fetchReport(rango, 'factura', 'db', 1),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
