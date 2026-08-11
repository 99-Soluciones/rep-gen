import {
  BaseReportService,
  type ReportConfig,
  type ReportLogger,
} from './base-report.service';
import type { Cache } from '@nestjs/cache-manager';
import type {
  FileMakerCondition,
  FindRecordsResult,
} from '../../../filemaker/ifilemaker';
import { FileMakerService } from '../../../filemaker/filemaker.service';

class TestReportService extends BaseReportService<
  Record<string, unknown>,
  unknown,
  unknown
> {}

describe('BaseReportService.makeFilterString permissions+filters', () => {
  const makeService = (
    overrides?: Partial<
      ReportConfig<Record<string, unknown>, unknown, unknown>
    >,
  ) => {
    const findRecords = jest.fn<
      Promise<FindRecordsResult>,
      [string, string, FileMakerCondition[], number?, number?]
    >();
    const fileMakerService = { findRecords } as unknown as FileMakerService;

    const cacheGet = jest
      .fn<Promise<unknown>, [string]>()
      .mockResolvedValue(undefined);
    const cacheSet = jest
      .fn<Promise<void>, [string, unknown]>()
      .mockResolvedValue(undefined);
    const cacheManager = { get: cacheGet, set: cacheSet } as unknown as Cache;

    const logger: ReportLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const permissionFiltersFunction = jest
      .fn<Promise<FileMakerCondition[]>, [unknown, string, number, string]>()
      .mockResolvedValue([
        { bankName: '==BANCO_A' },
        { bankName: '==BANCO_B' },
      ]);

    const config: ReportConfig<Record<string, unknown>, unknown, unknown> = {
      layoutName: 'layout',
      cachePrefix: 'prefix_',
      dateField: ['date'],
      permissionFieldName: ['bankName'],
      fieldMapping: {
        nombre_banco: 'bankName',
      },
      globalSearchFields: [],
      cleanDataFunction: () => [],
      permissionFiltersFunction,
      ...overrides,
    };

    const service = new TestReportService(
      fileMakerService,
      cacheManager,
      {},
      config,
      logger,
    );

    return {
      service,
      findRecords,
      cacheGet,
      cacheSet,
      logger,
      config,
    };
  };

  it('intersects user bank filter with permission bank conditions (no overwrite)', async () => {
    const { service, findRecords } = makeService();

    findRecords.mockResolvedValue({
      response: {
        data: [],
        dataInfo: {
          database: 'db',
          layout: 'layout',
          table: 't',
          totalRecordCount: 0,
          foundCount: 0,
          returnedCount: 0,
        },
      },
    });

    await service.fetchFromFileMakerWithFilters(
      1,
      50,
      '',
      {
        nombre_banco: {
          filterType: 'text',
          type: 'equals',
          filter: 'BANCO_A',
        },
      },
      { startDate: '', endDate: '' },
      'db',
      123,
    );

    expect(findRecords).toHaveBeenCalledTimes(1);
    const querySent = findRecords.mock.calls[0]?.[2];

    expect(querySent).toEqual([{ bankName: '==BANCO_A' }]);
  });

  it('returns empty response and does not call FileMaker when no permission condition matches user filter', async () => {
    const { service, findRecords } = makeService();

    const res = await service.fetchFromFileMakerWithFilters(
      1,
      50,
      '',
      {
        nombre_banco: {
          filterType: 'text',
          type: 'equals',
          filter: 'BANCO_C',
        },
      },
      { startDate: '', endDate: '' },
      'db',
      123,
    );

    expect(findRecords).not.toHaveBeenCalled();
    expect(res.data).toEqual([]);
    expect(res.meta.totalRecords).toBe(0);
  });

  it('keeps a condition if any mapped field already matches (no duplicates)', async () => {
    const { service, findRecords } = makeService({
      fieldMapping: {
        nombre_comercial: ['fieldA', 'fieldB'],
      },
      permissionFiltersFunction: jest
        .fn<Promise<FileMakerCondition[]>, [unknown, string, number, string]>()
        .mockResolvedValue([
          { fieldA: '==FOO', fieldB: '==FOO' },
          { fieldA: '==BAR', fieldB: '==BAR' },
        ]),
    });

    findRecords.mockResolvedValue({
      response: {
        data: [],
        dataInfo: {
          database: 'db',
          layout: 'layout',
          table: 't',
          totalRecordCount: 0,
          foundCount: 0,
          returnedCount: 0,
        },
      },
    });

    await service.fetchFromFileMakerWithFilters(
      1,
      50,
      '',
      {
        nombre_comercial: {
          filterType: 'text',
          type: 'equals',
          filter: 'FOO',
        },
      },
      { startDate: '', endDate: '' },
      'db',
      123,
    );

    const querySent = findRecords.mock.calls[0]?.[2];

    expect(querySent).toEqual([{ fieldA: '==FOO', fieldB: '==FOO' }]);
  });
});
