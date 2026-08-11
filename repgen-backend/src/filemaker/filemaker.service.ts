import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GetTokenResponse,
  FindRecordsResult,
  GetRecordResponse,
  LogOutResponse,
  FileMakerCondition,
  CreateRecordResponse,
  EditRecordResponse,
} from './ifilemaker';
import { LoggerService } from '../common/logger/';
/**
 * Servicio para interactuar con la API de FileMaker.
 * Proporciona métodos para autenticarse, cerrar sesión y realizar búsquedas de registros en FileMaker.
 * Este servicio maneja la autenticación y el almacenamiento del token de sesión,
 * así como la lógica para reintentar las consultas en caso de que el token haya expirado.
 */
@Injectable()
export class FileMakerService {
  //Variables para entorno .env
  private readonly fmServer: string;
  private readonly username: string;
  private readonly password: string;
  private readonly requestTimeoutMs: number;
  private readonly authCooldownMs: number;

  private tokens: Map<string, string> = new Map(); // Mapa para almacenar tokens por usuario o sesión
  private authInFlight: Map<string, Promise<string>> = new Map();
  private authNextAttemptTime: Map<string, number> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.fmServer = this.configService.get<string>('FM_SERVER') ?? '';
    this.username = this.configService.get<string>('FM_USERNAME') ?? '';
    this.password = this.configService.get<string>('FM_PASSWORD') ?? '';
    this.requestTimeoutMs =
      this.configService.get<number>('FM_REQUEST_TIMEOUT_MS') ?? 15000;
    this.authCooldownMs =
      this.configService.get<number>('FM_AUTH_COOLDOWN_MS') ?? 5000;
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.requestTimeoutMs,
    );

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Método para autenticarse con FileMaker y obtener un token de sesión.
   * @returns Promise<string> El token de sesión de FileMaker.
   */
  async authFileMaker(dbName: string): Promise<string> {
    const dbToken = this.tokens.get(dbName);
    if (dbToken) {
      this.logger.debug(
        `Usando token existente para la base de datos ${dbName}`,
      );
      return dbToken;
    }

    const nextAttemptTime = this.authNextAttemptTime.get(dbName) || 0;
    if (Date.now() < nextAttemptTime) {
      this.logger.warn(
        `Intento de autenticación bloqueado para la base de datos ${dbName}. Próximo intento permitido en ${new Date(
          nextAttemptTime,
        ).toISOString()}`,
      );
      throw new InternalServerErrorException(
        `Autenticación temporalmente bloqueada para la base de datos ${dbName} por múltiples intentos fallidos.`,
      );
    }

    const inFlight = this.authInFlight.get(dbName);
    if (inFlight) {
      this.logger.debug(
        `Esperando autenticación (Promise) en curso para la base de datos ${dbName}`,
      );
      return inFlight;
    }

    const url = `${this.fmServer}/fmi/data/vLatest/databases/${dbName}/sessions`;
    const credentials = Buffer.from(
      `${this.username}:${this.password}`,
    ).toString('base64');

    const authPromise = (async () => {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new InternalServerErrorException(
          `Error al autenticar con FileMaker en ${dbName}`,
        );
      }
      const data = (await response.json()) as GetTokenResponse;

      this.tokens.set(dbName, data.response.token);
      this.logger.log(`Token obtenido para la base de datos ${dbName}`);
      return data.response.token;
    })();

    this.authInFlight.set(dbName, authPromise);

    return authPromise
      .catch((err) => {
        this.authNextAttemptTime.set(dbName, Date.now() + this.authCooldownMs);
        this.logger.error(`Error al autenticar con FileMaker`, err as Error, {
          tenant: dbName,
        });
        throw err;
      })
      .finally(() => {
        this.authInFlight.delete(dbName);
      });
  }
  /**
   * Borra el token de sesión de FileMaker para cerrar la sesión. Si no hay un token de sesión activo, simplemente retorna sin hacer nada.
   * @returns void
   */
  async logoutFileMaker(dbName: string): Promise<void> {
    const token = this.tokens.get(dbName);
    if (!token) {
      return;
    }

    this.tokens.delete(dbName);

    const url = `${this.fmServer}/fmi/data/vLatest/databases/${dbName}/sessions/${token}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Error al cerrar sesión en FileMaker',
      );
    }

    const data = (await response.json()) as LogOutResponse;
    if (data.message.code !== '0') {
      throw new InternalServerErrorException(
        'Error al cerrar sesión en FileMaker: ' + data.message.message,
      );
    }
  }

  /**
   * Obtiene todos los registros de una base de datos y layout.
   * @param dbName El nombre de la base de datos en FileMaker.
   * @param layout El nombre del layout en FileMaker.
   * @returns Promise<FindRecordsResult> El resultado de la búsqueda.
   */
  async getAllRecords(
    dbName: string,
    layout: string,
  ): Promise<FindRecordsResult> {
    const url = encodeURI(
      `${this.fmServer}/fmi/data/vLatest/databases/${dbName}/layouts/${layout}/records`,
    );
    try {
      let dbToken = this.tokens.get(dbName);
      if (!dbToken) {
        this.tokens.delete(dbName);
        await this.authFileMaker(dbName);
        if (!this.tokens.get(dbName)) {
          this.logger.error(
            `No se pudo obtener un token de sesión válido para la base de datos ${dbName} después de intentar autenticarse.`,
            undefined,
            { tenant: dbName },
          );
          throw new InternalServerErrorException(
            'No se pudo acceder a FileMaker: no se obtuvo un token de sesión válido.',
          );
        }
        dbToken = this.tokens.get(dbName)!;
      }

      const executeGetAllRecords = async (token: string): Promise<Response> => {
        return this.fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      };
      let response = await executeGetAllRecords(dbToken);
      if (response.status === 401) {
        this.tokens.delete(dbName);
        await this.authFileMaker(dbName);
        const newToken = this.tokens.get(dbName);
        if (!newToken) {
          this.logger.error(
            `No se pudo obtener un token de sesión válido para la base de datos ${dbName} después de reintentar autenticarse.`,
            undefined,
            { tenant: dbName },
          );
          throw new InternalServerErrorException(
            'No se pudo obtener un token de sesión válido para la base de datos ${dbName} después de reintentar autenticarse.',
          );
        }
        response = await executeGetAllRecords(newToken);
      }
      const result = (await response.json()) as FindRecordsResult;
      return result;
    } catch (error) {
      this.logger.error(
        `Error al obtener todos los registros de la base de datos ${dbName} y layout ${layout}`,
        error as Error,
        { tenant: dbName, layout },
      );
      throw new InternalServerErrorException(
        `Error al obtener todos los registros de la base de datos ${dbName} y layout ${layout}`,
      );
    }
  }
  /**
   * Realiza una búsqueda de registros en FileMaker.
   * @param dbName El nombre de la base de datos en FileMaker donde se realizará la búsqueda.
   * @param layout El nombre del layout en FileMaker donde se realizará la búsqueda.
   * @param query Un array de objetos que representan los criterios de búsqueda. Cada objeto debe tener la estructura { fieldName: value }.
   * @param offset El número de registro desde el cual comenzar a devolver resultados (paginación). Por defecto es 1.
   * @param limit El número máximo de registros a devolver. Por defecto es 50.
   * @returns Promise<FindRecordsResult> El resultado de la búsqueda.
   */
  async findRecords(
    dbName: string,
    layout: string,
    query: FileMakerCondition[],
    offset: number = 1,
    limit: number = 50,
  ): Promise<FindRecordsResult> {
    const url = encodeURI(
      `${this.fmServer}/fmi/data/vLatest/databases/${dbName}/layouts/${layout}/_find`,
    );

    const body = {
      query,
      offset,
      limit,
    };
    try {
      let dbToken = this.tokens.get(dbName);
      if (!dbToken) {
        this.tokens.delete(dbName);
        await this.authFileMaker(dbName);
        if (!this.tokens.get(dbName)) {
          this.logger.error(
            `No se pudo obtener un token de sesión válido para la base de datos ${dbName} después de intentar autenticarse.`,
            undefined,
            { tenant: dbName },
          );
          throw new InternalServerErrorException(
            'No se pudo acceder a FileMaker: no se obtuvo un token de sesión válido.',
          );
        }
        dbToken = this.tokens.get(dbName)!;
      }

      const executeFind = async (token: string): Promise<Response> => {
        return this.fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      };

      let response = await executeFind(dbToken);
      if (response.status === 401) {
        this.tokens.delete(dbName);
        await this.authFileMaker(dbName);
        const newToken = this.tokens.get(dbName);
        if (!newToken) {
          this.logger.error(
            `No se pudo obtener un token de sesión válido para la base de datos ${dbName} después de reintentar autenticarse.`,
            undefined,
            { tenant: dbName },
          );
          throw new InternalServerErrorException(
            'No se pudo acceder a FileMaker: no se obtuvo un token de sesión válido tras reintentar.',
          );
        }
        response = await executeFind(newToken);
      }

      this.logger.log(
        `Búsqueda realizada en la base de datos ${dbName} con layout ${layout}. Status: ${response.status}`,
      );
      const result = (await response.json()) as FindRecordsResult;
      return result;
    } catch (error) {
      this.logger.error(
        'Error al realizar la búsqueda de registros en FileMaker',
        error as Error,
        { tenant: dbName, layout },
      );
      throw new InternalServerErrorException(
        'Error al realizar la búsqueda de registros en FileMaker',
      );
    }
  }

  async getRecord(
    dbName: string,
    layout: string,
    recordId: string,
  ): Promise<GetRecordResponse> {
    const url = `${this.fmServer}/fmi/data/vLatest/databases/${dbName}/layouts/${layout}/records/${recordId}`;

    const executeGet = async (tokenToUse: string): Promise<Response> => {
      return this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
    };

    let token = this.tokens.get(dbName);
    if (!token) {
      this.tokens.delete(dbName);
      token = await this.authFileMaker(dbName);
    }
    let response = await executeGet(token);

    if (response.status === 401) {
      this.tokens.delete(dbName);
      token = await this.authFileMaker(dbName);
      response = await executeGet(token);
    }

    if (!response.ok) {
      this.logger.error(
        `Error al obtener registro ${recordId} en FileMaker en ${dbName}: ${response.status}`,
        undefined,
        { tenant: dbName, layout, recordId },
      );
      throw new InternalServerErrorException(
        'Error al obtener registro en FileMaker',
      );
    }

    return (await response.json()) as GetRecordResponse;
  }

  async createRecord(
    dbName: string,
    layout: string,
    fieldData: Record<string, unknown>,
  ): Promise<CreateRecordResponse> {
    const url = `${this.fmServer}/fmi/data/vLatest/databases/${dbName}/layouts/${layout}/records`;

    const executeCreate = async (tokenToUse: string): Promise<Response> => {
      return this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fieldData }),
      });
    };
    let token = this.tokens.get(dbName);
    if (!token) {
      this.tokens.delete(dbName);
      token = await this.authFileMaker(dbName);
    }
    let response = await executeCreate(token);
    if (response.status === 401) {
      this.tokens.delete(dbName);
      token = await this.authFileMaker(dbName);
      response = await executeCreate(token);
    }

    if (!response.ok) {
      this.logger.error(
        `Error al crear registro en FileMaker en ${dbName}: ${response.status} ${response.statusText}`,
        undefined,
        { tenant: dbName, layout },
      );
      throw new InternalServerErrorException(
        'Error al crear registro en FileMaker',
      );
    }

    const result = (await response.json()) as CreateRecordResponse;

    this.logger.log(
      `Registro creado en la base de datos ${dbName}, layout ${layout}, recordId ${result.response.recordId}`,
    );
    return result;
  }

  async editRecord(
    dbName: string,
    layout: string,
    recordId: string,
    fieldData: Record<string, unknown>,
  ): Promise<EditRecordResponse> {
    const url = `${this.fmServer}/fmi/data/vLatest/databases/${dbName}/layouts/${layout}/records/${recordId}`;

    const executeEdit = async (tokenToUse: string): Promise<Response> => {
      return this.fetchWithTimeout(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fieldData }),
      });
    };

    let token = this.tokens.get(dbName);
    if (!token) {
      this.tokens.delete(dbName);
      token = await this.authFileMaker(dbName);
    }
    let response = await executeEdit(token);

    if (response.status === 401) {
      this.tokens.delete(dbName);
      token = await this.authFileMaker(dbName);
      response = await executeEdit(token);
    }

    if (!response.ok) {
      this.logger.error(
        `Error al editar registro ${recordId} en FileMaker en ${dbName}: ${response.status} ${response.statusText}`,
        undefined,
        { tenant: dbName, layout, recordId },
      );
      throw new InternalServerErrorException(
        'Error al editar registro en FileMaker',
      );
    }

    const result = (await response.json()) as EditRecordResponse;
    this.logger.log(
      `Registro ${recordId} editado en la base de datos ${dbName}`,
    );
    return result;
  }

  async deleteRecord(
    dbName: string,
    layout: string,
    recordId: string,
  ): Promise<void> {
    const url = `${this.fmServer}/fmi/data/vLatest/databases/${dbName}/layouts/${layout}/records/${recordId}`;

    const executeDelete = async (tokenToUse: string): Promise<Response> => {
      return this.fetchWithTimeout(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
      });
    };

    let token = this.tokens.get(dbName);
    if (!token) {
      this.tokens.delete(dbName);
      token = await this.authFileMaker(dbName);
    }
    let response = await executeDelete(token);

    if (response.status === 401) {
      this.tokens.delete(dbName);
      token = await this.authFileMaker(dbName);
      response = await executeDelete(token);
    }

    if (!response.ok) {
      this.logger.error(
        `Error al eliminar registro en FileMaker en ${dbName}: ${response.status} ${response.statusText}`,
        undefined,
        { tenant: dbName, layout, recordId },
      );
      throw new InternalServerErrorException(
        'Error al eliminar registro en FileMaker',
      );
    }
    this.logger.log(
      `Registro ${recordId} eliminado en la base de datos ${dbName}`,
    );
  }
}
