import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteReportConfigUseCase } from './delete-report-config.use-case';
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

describe('DeleteReportConfigUseCase', () => {
  let useCase: DeleteReportConfigUseCase;
  const mockFileMaker = {
    findRecords: jest.fn(),
    deleteRecord: jest.fn(),
  };
  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteReportConfigUseCase,
        { provide: FileMakerService, useValue: mockFileMaker },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();
    useCase = module.get(DeleteReportConfigUseCase);
    jest.clearAllMocks();
  });

  it('elimina la config usando el recordId interno tras verificar propiedad', async () => {
    mockFileMaker.findRecords.mockResolvedValue({
      response: { data: [rawRecord()] },
    });
    mockFileMaker.deleteRecord.mockResolvedValue(undefined);

    await useCase.execute('db', 42, 'cfg-uuid-5');

    expect(mockFileMaker.deleteRecord).toHaveBeenCalledWith(
      'db',
      'api_configReporte',
      'fm1',
    );
  });

  it('lanza ForbiddenException y no elimina si pertenece a otro usuario', async () => {
    mockFileMaker.findRecords.mockResolvedValue({
      response: { data: [rawRecord({ [fm.userId]: 99 })] },
    });

    await expect(
      useCase.execute('db', 42, 'cfg-uuid-5'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockFileMaker.deleteRecord).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si la config no existe', async () => {
    mockFileMaker.findRecords.mockResolvedValue({ response: { data: [] } });
    await expect(
      useCase.execute('db', 42, 'cfg-uuid-5'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
