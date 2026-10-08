import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { FileMakerService } from '../filemaker/filemaker.service';
import { LoggerService } from '../common/logger/logger.service';
import { UnauthorizedException } from '@nestjs/common';
import { apiAuthFieldMapJson } from './auth-field-map';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = { signAsync: jest.fn() };
  const mockFileMakerService = {
    findRecords: jest.fn(),
    deleteRecord: jest.fn(),
  };
  const mockLogger = {
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: FileMakerService, useValue: mockFileMakerService },
        { provide: LoggerService, useValue: mockLogger },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'MASTER_KEY') return 'master-key-test';
              return null;
            }) as unknown as ConfigService,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should validate if token is the master key and return accessToken and user', async () => {
    const masterToken = 'master-key-test';
    const dbName = 'testdb';
    mockJwtService.signAsync.mockResolvedValue('signed-token');

    const res = await service.validateTokenFileMaker(masterToken, dbName);
    expect(res.accessToken).toBe('signed-token');
    expect(res.user).toMatchObject({
      id: 2,
      name: 'Developer',
      role: 'api_user',
      tenant: dbName,
    });
  });

  it('should ignore the master key in production', async () => {
    const productionConfig = {
      get: (key: string) =>
        ({ MASTER_KEY: 'master-key-test', NODE_ENV: 'production' })[key],
    } as unknown as ConfigService;
    const productionService = new AuthService(
      mockJwtService as unknown as JwtService,
      mockFileMakerService as unknown as FileMakerService,
      mockLogger as unknown as LoggerService,
      productionConfig,
    );
    mockJwtService.signAsync.mockResolvedValue('signed-token');

    await expect(
      productionService.validateTokenFileMaker('master-key-test', 'testdb'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if token is the master key and validate filemaker token fails', async () => {
    const masterToken = 'invalid-master-key';
    const dbName = 'testdb';
    mockJwtService.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.validateTokenFileMaker(masterToken, dbName),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('should validate a correct token and return accessToken and user', async () => {
    const token = '11111111-1111-1111-1111-111111111111';
    const dbName = 'testdb';
    const now = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const fieldDataKeyExp = apiAuthFieldMapJson.data.fecha_expiration;
    const fieldDataKeyName = apiAuthFieldMapJson.data.nombre_usuario;
    const fieldDataKeyId = apiAuthFieldMapJson.data.id_usuario;
    mockFileMakerService.findRecords = jest.fn().mockResolvedValue({
      response: {
        data: [
          {
            fieldData: {
              [fieldDataKeyExp]: now,
              [fieldDataKeyName]: 'Juan',
              [fieldDataKeyId]: 42,
            },
            recordId: '1',
          },
        ],
      },
    });
    mockJwtService.signAsync.mockResolvedValue('signed-token');
    const res = await service.validateTokenFileMaker(token, dbName);
    expect(res.accessToken).toBe('signed-token');
    expect(res.user).toMatchObject({
      id: 42,
      name: 'Juan',
      role: 'api_user',
      tenant: dbName,
    });
  });

  it('should coerce a string id_usuario from FileMaker into a numeric id', async () => {
    const token = '66666666-6666-6666-6666-666666666666';
    const dbName = 'testdb';
    const now = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const fieldDataKeyExp = apiAuthFieldMapJson.data.fecha_expiration;
    const fieldDataKeyName = apiAuthFieldMapJson.data.nombre_usuario;
    const fieldDataKeyId = apiAuthFieldMapJson.data.id_usuario;
    mockFileMakerService.findRecords = jest.fn().mockResolvedValue({
      response: {
        data: [
          {
            fieldData: {
              [fieldDataKeyExp]: now,
              [fieldDataKeyName]: 'Maria',
              [fieldDataKeyId]: '45',
            },
            recordId: '3',
          },
        ],
      },
    });
    mockJwtService.signAsync.mockResolvedValue('signed-token');
    const res = await service.validateTokenFileMaker(token, dbName);
    expect(res.user.id).toBe(45);
    expect(res.user.id).not.toBe('45');
  });

  it('should throw UnauthorizedException for invalid token format', async () => {
    const badToken = 'bad-token';
    await expect(
      service.validateTokenFileMaker(badToken, 'db'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException for expired token and attempt to delete record', async () => {
    const token = '22222222-2222-2222-2222-222222222222';
    const dbName = 'testdb';
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const fieldDataKeyExp = apiAuthFieldMapJson.data.fecha_expiration;
    const fieldDataKeyName = apiAuthFieldMapJson.data.nombre_usuario;
    const fieldDataKeyId = apiAuthFieldMapJson.data.id_usuario;
    mockFileMakerService.findRecords = jest.fn().mockResolvedValue({
      response: {
        data: [
          {
            fieldData: {
              [fieldDataKeyExp]: past,
              [fieldDataKeyName]: 'Ana',
              [fieldDataKeyId]: 7,
            },
            recordId: '2',
          },
        ],
      },
    });
    mockFileMakerService.deleteRecord = jest.fn().mockResolvedValue(undefined);

    await expect(
      service.validateTokenFileMaker(token, dbName),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockFileMakerService.deleteRecord).toHaveBeenCalledWith(
      dbName,
      'api_auth',
      '2',
    );
  });

  it('should throw UnauthorizedException when token not found in FileMaker', async () => {
    const token = '33333333-3333-3333-3333-333333333333';
    const dbName = 'dbEmpty';
    mockFileMakerService.findRecords = jest
      .fn()
      .mockResolvedValue({ response: { data: [] } });
    await expect(
      service.validateTokenFileMaker(token, dbName),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException when jwt.signAsync fails', async () => {
    const token = '44444444-4444-4444-4444-444444444444';
    const dbName = 'testdb';
    const now = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const fieldDataKeyExp = apiAuthFieldMapJson.data.fecha_expiration;
    const fieldDataKeyName = apiAuthFieldMapJson.data.nombre_usuario;
    const fieldDataKeyId = apiAuthFieldMapJson.data.id_usuario;
    mockFileMakerService.findRecords = jest.fn().mockResolvedValue({
      response: {
        data: [
          {
            fieldData: {
              [fieldDataKeyExp]: now,
              [fieldDataKeyName]: 'Luis',
              [fieldDataKeyId]: 9,
            },
            recordId: '9',
          },
        ],
      },
    });
    mockJwtService.signAsync.mockRejectedValue(new Error('jwt sign failed'));

    await expect(
      service.validateTokenFileMaker(token, dbName),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should return accessToken even if deleteRecord throws after sign', async () => {
    const token = '55555555-5555-5555-5555-555555555555';
    const dbName = 'testdb';
    const now = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const fieldDataKeyExp = apiAuthFieldMapJson.data.fecha_expiration;
    const fieldDataKeyName = apiAuthFieldMapJson.data.nombre_usuario;
    const fieldDataKeyId = apiAuthFieldMapJson.data.id_usuario;
    mockFileMakerService.findRecords = jest.fn().mockResolvedValue({
      response: {
        data: [
          {
            fieldData: {
              [fieldDataKeyExp]: now,
              [fieldDataKeyName]: 'Rosa',
              [fieldDataKeyId]: 15,
            },
            recordId: '15',
          },
        ],
      },
    });
    mockJwtService.signAsync.mockResolvedValue('token-xyz');
    mockFileMakerService.deleteRecord = jest
      .fn()
      .mockRejectedValue(new Error('delete failed'));

    const res = await service.validateTokenFileMaker(token, dbName);
    expect(res.accessToken).toBe('token-xyz');
    expect(mockFileMakerService.deleteRecord).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
