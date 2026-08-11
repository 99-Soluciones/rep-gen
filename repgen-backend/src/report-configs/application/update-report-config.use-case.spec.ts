import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateReportConfigUseCase } from './update-report-config.use-case';
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

describe('UpdateReportConfigUseCase', () => {
  let useCase: UpdateReportConfigUseCase;
  const mockFileMaker = {
    findRecords: jest.fn(),
    editRecord: jest.fn(),
  };
  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateReportConfigUseCase,
        { provide: FileMakerService, useValue: mockFileMaker },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();
    useCase = module.get(UpdateReportConfigUseCase);
    jest.clearAllMocks();
  });

  it('actualiza nombre y columnState del registro propio', async () => {
    mockFileMaker.findRecords
      .mockResolvedValueOnce({ response: { data: [rawRecord()] } }) // ownership
      .mockResolvedValueOnce({
        response: { data: [rawRecord({ [fm.name]: 'Editada' })] },
      }); // recarga
    mockFileMaker.editRecord.mockResolvedValue({ response: { modId: '1' } });

    const res = await useCase.execute('db', 42, 'cfg-uuid-5', {
      name: 'Editada',
      columnState: [{ colId: 'a', hide: true }],
    });

    expect(mockFileMaker.editRecord).toHaveBeenCalledWith(
      'db',
      'api_configReporte',
      'fm1',
      expect.objectContaining({
        [fm.name]: 'Editada',
        [fm.columnState]: JSON.stringify([{ colId: 'a', hide: true }]),
      }),
    );
    expect(res.name).toBe('Editada');
  });

  it('lanza ForbiddenException si la config pertenece a otro usuario', async () => {
    mockFileMaker.findRecords.mockResolvedValue({
      response: { data: [rawRecord({ [fm.userId]: 99 })] },
    });

    await expect(
      useCase.execute('db', 42, 'cfg-uuid-5', { name: 'X' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockFileMaker.editRecord).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si la config no existe', async () => {
    mockFileMaker.findRecords.mockResolvedValue({ response: { data: [] } });
    await expect(
      useCase.execute('db', 42, 'cfg-uuid-5', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('desmarca el default anterior al setear isDefault=true', async () => {
    mockFileMaker.findRecords
      .mockResolvedValueOnce({ response: { data: [rawRecord()] } }) // ownership
      .mockResolvedValueOnce({
        response: { data: [{ recordId: 'old', fieldData: {} }] },
      }) // defaults existentes
      .mockResolvedValueOnce({
        response: { data: [rawRecord({ [fm.isDefault]: 1 })] },
      }); // recarga
    mockFileMaker.editRecord.mockResolvedValue({ response: { modId: '1' } });

    await useCase.execute('db', 42, 'cfg-uuid-5', { isDefault: true });

    // Desmarca el default anterior ('old') y marca el propio ('fm1')
    expect(mockFileMaker.editRecord).toHaveBeenCalledWith(
      'db',
      'api_configReporte',
      'old',
      { [fm.isDefault]: 0 },
    );
    expect(mockFileMaker.editRecord).toHaveBeenCalledWith(
      'db',
      'api_configReporte',
      'fm1',
      expect.objectContaining({ [fm.isDefault]: 1 }),
    );
  });
});
