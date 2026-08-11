import { Test, TestingModule } from '@nestjs/testing';
import { CreateReportConfigUseCase } from './create-report-config.use-case';
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

describe('CreateReportConfigUseCase', () => {
  let useCase: CreateReportConfigUseCase;
  const mockFileMaker = {
    createRecord: jest.fn(),
    getRecord: jest.fn(),
    findRecords: jest.fn(),
    editRecord: jest.fn(),
  };
  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReportConfigUseCase,
        { provide: FileMakerService, useValue: mockFileMaker },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();
    useCase = module.get(CreateReportConfigUseCase);
    jest.clearAllMocks();
  });

  it('crea el registro y lo recupera por su recordId interno de FileMaker', async () => {
    mockFileMaker.createRecord.mockResolvedValue({
      response: { recordId: 'fm1', modId: '0' },
    });
    mockFileMaker.getRecord.mockResolvedValue({
      response: { data: [rawRecord()] },
    });

    const res = await useCase.execute(
      'db',
      42,
      'bancos',
      'Config A',
      [{ colId: 'a', hide: false }],
      false,
    );

    expect(mockFileMaker.createRecord).toHaveBeenCalledWith(
      'db',
      'api_configReporte',
      expect.objectContaining({
        [fm.userId]: 42,
        [fm.reportId]: 'bancos',
        [fm.name]: 'Config A',
        [fm.isDefault]: 0,
      }),
    );
    // Clave: recupera con el recordId interno (no con el serial _id_configRec)
    expect(mockFileMaker.getRecord).toHaveBeenCalledWith(
      'db',
      'api_configReporte',
      'fm1',
    );
    expect(res.name).toBe('Config A');
    expect(res.id).toBe('cfg-uuid-5');
  });

  it('desmarca el default anterior cuando se crea con isDefault=true', async () => {
    mockFileMaker.findRecords.mockResolvedValue({
      response: { data: [{ recordId: 'old', fieldData: {} }] },
    });
    mockFileMaker.editRecord.mockResolvedValue({ response: { modId: '1' } });
    mockFileMaker.createRecord.mockResolvedValue({
      response: { recordId: 'fm2', modId: '0' },
    });
    mockFileMaker.getRecord.mockResolvedValue({
      response: { data: [rawRecord({ [fm.isDefault]: 1 })] },
    });

    await useCase.execute('db', 42, 'bancos', 'Nueva', [], true);

    expect(mockFileMaker.editRecord).toHaveBeenCalledWith(
      'db',
      'api_configReporte',
      'old',
      { [fm.isDefault]: 0 },
    );
    expect(mockFileMaker.createRecord).toHaveBeenCalled();
  });

  it('lanza error si FileMaker no devuelve recordId al crear', async () => {
    mockFileMaker.createRecord.mockResolvedValue({
      response: { recordId: '', modId: '0' },
    });
    await expect(
      useCase.execute('db', 42, 'bancos', 'X', [], false),
    ).rejects.toThrow();
  });
});
