import { Test, TestingModule } from '@nestjs/testing';
import { GetReportConfigsUseCase } from './get-report-configs.use-case';
import { FileMakerService } from '../../filemaker/filemaker.service';
import { LoggerService } from '../../common/logger/logger.service';
import { reportConfigFieldMap as fm } from '../infrastructure/report-config-field-map';

const rawRecord = (over: Record<string, unknown> = {}) => ({
  recordId: 'fm1',
  fieldData: {
    [fm.id]: 'cfg-uuid-5',
    [fm.userId]: 42,
    [fm.reportId]: 'bancos',
    [fm.name]: 'Config A',
    [fm.columnState]: JSON.stringify([{ colId: 'a', hide: false }]),
    [fm.isDefault]: 0,
    [fm.createdAt]: '',
    [fm.updatedAt]: '',
    ...over,
  },
});

describe('GetReportConfigsUseCase', () => {
  let useCase: GetReportConfigsUseCase;
  const mockFileMaker = { findRecords: jest.fn() };
  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetReportConfigsUseCase,
        { provide: FileMakerService, useValue: mockFileMaker },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();
    useCase = module.get(GetReportConfigsUseCase);
    jest.clearAllMocks();
  });

  it('busca por usuario + reporte y retorna las configs mapeadas', async () => {
    mockFileMaker.findRecords.mockResolvedValue({
      response: { data: [rawRecord()] },
    });

    const res = await useCase.execute('db', 42, 'bancos');

    expect(mockFileMaker.findRecords).toHaveBeenCalledWith(
      'db',
      'api_configReporte',
      [{ [fm.userId]: 42, [fm.reportId]: 'bancos' }],
      1,
      1000,
    );
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('cfg-uuid-5');
    expect(res[0].name).toBe('Config A');
    expect(res[0].columnState).toEqual([{ colId: 'a', hide: false }]);
  });

  it('retorna [] cuando no hay configuraciones', async () => {
    mockFileMaker.findRecords.mockResolvedValue({ response: { data: [] } });
    const res = await useCase.execute('db', 42, 'bancos');
    expect(res).toEqual([]);
  });

  it('retorna [] y registra el error si FileMaker falla', async () => {
    mockFileMaker.findRecords.mockRejectedValue(new Error('boom'));
    const res = await useCase.execute('db', 42, 'bancos');
    expect(res).toEqual([]);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
