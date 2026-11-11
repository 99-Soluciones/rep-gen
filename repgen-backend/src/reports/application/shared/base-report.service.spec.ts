import {
  BaseReportService,
  type ReportConfig,
  type ReportLogger,
} from './base-report.service';
import type { Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type {
  FileMakerCondition,
  FindRecordsResult,
} from '../../../filemaker/ifilemaker';
import {
  FileMakerService,
  type FmSessionUse,
} from '../../../filemaker/filemaker.service';

class TestReportService extends BaseReportService<unknown, unknown> {}

const OCTOBER = { startDate: '2026-10-01', endDate: '2026-10-31' };
const FM_OCTOBER = '10/01/2026...10/31/2026';

const findResult = (data: FindRecordsResult['response']['data'] = []) => ({
  response: {
    data,
    dataInfo: {
      database: 'db',
      layout: 'layout',
      table: 't',
      totalRecordCount: data.length,
      foundCount: data.length,
      returnedCount: data.length,
    },
  },
});

describe('BaseReportService', () => {
  const makeService = (overrides?: Partial<ReportConfig<unknown, unknown>>) => {
    const findRecords = jest
      .fn<
        Promise<FindRecordsResult>,
        [string, string, FileMakerCondition[], number?, number?, FmSessionUse?]
      >()
      .mockResolvedValue(findResult());
    const fileMakerService = { findRecords } as unknown as FileMakerService;

    const store = new Map<string, unknown>();
    const cacheManager = {
      get: (key: string) => Promise.resolve(store.get(key)),
      set: (key: string, value: unknown) => {
        store.set(key, value);
        return Promise.resolve();
      },
    } as unknown as Cache;

    const logger: ReportLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const config: ReportConfig<unknown, unknown> = {
      layoutName: 'layout',
      cachePrefix: 'prefix_',
      dateField: ['date'],
      permissionFieldName: ['bankName'],
      cleanDataFunction: (rawData) => rawData,
      ...overrides,
    };

    const service = new TestReportService(
      fileMakerService,
      cacheManager,
      {},
      config,
      logger,
    );

    return { service, findRecords };
  };

  it('expands every permission condition across every date field', async () => {
    const { service, findRecords } = makeService({
      dateField: ['dateA', 'dateB'],
      permissionFiltersFunction: () =>
        Promise.resolve([{ bankName: '==BANCO_A' }, { bankName: '==BANCO_B' }]),
    });

    await service.fetchReport(OCTOBER, 'db', 123);

    expect(findRecords.mock.calls[0][2]).toEqual([
      { bankName: '==BANCO_A', dateA: FM_OCTOBER },
      { bankName: '==BANCO_A', dateB: FM_OCTOBER },
      { bankName: '==BANCO_B', dateA: FM_OCTOBER },
      { bankName: '==BANCO_B', dateB: FM_OCTOBER },
    ]);
  });

  it('queries only by date when the report has no permission filter', async () => {
    const { service, findRecords } = makeService();

    await service.fetchReport(OCTOBER, 'db', 123);

    expect(findRecords.mock.calls[0][2]).toEqual([{ date: FM_OCTOBER }]);
  });

  it('queries FileMaker on the reports session', async () => {
    const { service, findRecords } = makeService();

    await service.fetchReport(OCTOBER, 'db', 123);

    expect(findRecords.mock.calls[0][5]).toBe('reportes');
  });

  it('does not share cached results between users of the same tenant', async () => {
    const { service, findRecords } = makeService();

    await service.fetchReport(OCTOBER, 'db', 1);
    await service.fetchReport(OCTOBER, 'db', 2);
    await service.fetchReport(OCTOBER, 'db', 1);

    // user 2 must hit FileMaker with its own permissions; user 1's repeat is cached
    expect(findRecords).toHaveBeenCalledTimes(2);
  });

  it('responds 500 instead of 400 when a FileMaker record does not match the schema', async () => {
    const { service, findRecords } = makeService({
      cleanDataFunction: () => {
        throw new BadRequestException('record invalido');
      },
    });
    findRecords.mockResolvedValue(
      findResult([{ fieldData: {}, recordId: 'r1' }]),
    );

    await expect(service.fetchReport(OCTOBER, 'db', 1)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
