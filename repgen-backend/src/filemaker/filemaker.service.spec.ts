import { Test, TestingModule } from '@nestjs/testing';
import { FileMakerService } from './filemaker.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/logger';
import { InternalServerErrorException } from '@nestjs/common';

describe('FileMakerService', () => {
  let service: FileMakerService;
  const mockConfig = { get: jest.fn() } as unknown as ConfigService;
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  } as unknown as LoggerService;

  beforeEach(async () => {
    (mockConfig.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'FM_SERVER') return 'https://fm.example.com';
      if (key === 'FM_USERNAME') return 'user';
      if (key === 'FM_PASSWORD') return 'pass';
      if (key === 'FM_REQUEST_TIMEOUT_MS') return 5000;
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileMakerService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<FileMakerService>(FileMakerService);
    jest.clearAllMocks();
  });

  it('authFileMaker should return token when fetch ok', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      // json: async () => ({ response: { token: 'tkn' } }),
      json: () => ({ response: { token: 'tkn' } }),
    });

    const token = await service.authFileMaker('db1');
    expect(token).toBe('tkn');
  });

  it('authFileMaker should throw on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });
    await expect(service.authFileMaker('db2')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('findRecords should authenticate and return data', async () => {
    // auth response then find response
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 'tkn1' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => ({
          response: { data: [{ fieldData: { sample: 'x' }, recordId: 'r1' }] },
        }),
      });

    const res = await service.findRecords(
      'dbA',
      'layoutA',
      [{ sample: 'x' }],
      1,
      10,
    );
    expect(res.response.data[0].fieldData.sample).toBe('x');
  });

  it('findRecords should retry on 401 and succeed after reauth', async () => {
    // sequence: auth1, find->401, auth2, find->ok
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 't1' } }),
      })
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 't2' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => ({
          response: { data: [{ fieldData: { val: 'ok' }, recordId: 'r2' }] },
        }),
      });

    const res = await service.findRecords('dbB', 'layoutB', [{ f: 'v' }]);
    expect(res.response.data[0].fieldData.val).toBe('ok');
  });

  it('deleteRecord should retry on 401 and succeed', async () => {
    // auth1 (initial), delete->401, auth2, delete->ok
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 'ta' } }),
      })
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 'tb' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ message: { code: '0' } }),
      });

    await expect(
      service.deleteRecord('dbC', 'layoutC', 'rec1'),
    ).resolves.toBeUndefined();
  });

  it('createRecord should authenticate and return the new recordId', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 'tk' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { recordId: 'r10', modId: '0' } }),
      });

    const res = await service.createRecord('dbD', 'layoutD', { campo: 'x' });
    expect(res.response.recordId).toBe('r10');
  });

  it('createRecord should throw on non-ok response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 'tk' } }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' });

    await expect(
      service.createRecord('dbD', 'layoutD', { campo: 'x' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('editRecord should retry on 401 and return modId', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 'te1' } }),
      })
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 'te2' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { modId: '3' } }),
      });

    const res = await service.editRecord('dbE', 'layoutE', 'rec9', {
      campo: 'y',
    });
    expect(res.response.modId).toBe('3');
  });

  it('getRecord should authenticate and return the record data', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ response: { token: 'tg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({
          response: { data: [{ fieldData: { campo: 'z' }, recordId: 'r20' }] },
        }),
      });

    const res = await service.getRecord('dbF', 'layoutF', 'r20');
    expect(res.response.data[0].fieldData.campo).toBe('z');
  });
});
