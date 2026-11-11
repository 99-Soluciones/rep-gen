import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Cache } from '@nestjs/cache-manager';
import type { FileMakerService } from '../../../filemaker/filemaker.service';
import type { GetBankPermissionsUseCase } from '../../../user/application';
import type { LoggerService } from '../../../common/logger';
import {
  GetReceivablesReportUseCase,
  hoyEnMexico,
} from './get-receivables-report.use-case';

const vacio = { response: { data: [], dataInfo: { foundCount: 0 } } };

describe('GetReceivablesReportUseCase', () => {
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
      useCase: new GetReceivablesReportUseCase(fm, cache, permisos, logger),
      findImpl,
    };
  };

  it('sin fecha usa hoy en México y consulta los dos layouts con límite de portales', async () => {
    const { useCase, findImpl } = make();
    const res = await useCase.fetchReport(undefined, 'db', 1);

    expect(res).toEqual({ fechaCorte: hoyEnMexico(), data: [] });
    expect(findImpl).toHaveBeenCalledTimes(2);
    const layouts = findImpl.mock.calls.map((c: unknown[]) => c[1]);
    expect(layouts).toEqual(['apiExport_CxC_Facturas', 'apiExport_CxC_Bancos']);
    for (const call of findImpl.mock.calls as unknown[][]) {
      expect(call[5]).toBe('reportes');
      expect(Object.keys(call[6] as object).length).toBeGreaterThan(0);
    }
  });

  it('cachea por corte: la segunda consulta no va a FileMaker', async () => {
    const { useCase, findImpl } = make();
    await useCase.fetchReport('2024-06-10', 'db', 1);
    await useCase.fetchReport('2024-06-10', 'db', 1);
    expect(findImpl).toHaveBeenCalledTimes(2);
  });

  it('rechaza una fecha futura o inválida', async () => {
    const { useCase } = make();
    await expect(
      useCase.fetchReport('2999-01-01', 'db', 1),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      useCase.fetchReport('2024-02-31', 'db', 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('un registro con formato inesperado responde 500', async () => {
    const malo = {
      response: {
        data: [{ recordId: '1', fieldData: {} }],
        dataInfo: { foundCount: 1 },
      },
    };
    const { useCase } = make(jest.fn().mockResolvedValue(malo));
    await expect(
      useCase.fetchReport('2024-06-10', 'db', 1),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
