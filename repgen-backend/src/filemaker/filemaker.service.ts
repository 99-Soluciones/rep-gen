import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GetTokenResponse,
  FindRecordsResult,
  GetRecordResponse,
  FileMakerCondition,
  CreateRecordResponse,
  EditRecordResponse,
  FileMakerErrorBody,
} from './ifilemaker';
import { LoggerService } from '../common/logger/';

/** Código de FileMaker para "ningún registro coincide": un find vacío, no un error. */
const FM_NO_RECORDS_MATCH = '401';

/**
 * Servicio para interactuar con la API de FileMaker.
 * Proporciona métodos para autenticarse y realizar operaciones sobre registros en FileMaker.
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
   * URL de la base de datos en la Data API. dbName y layout se codifican porque
   * el tenant llega del cliente: sin codificar, un "/" o ".." cambiaría la ruta.
   */
  private databaseUrl(dbName: string, path = ''): string {
    return `${this.fmServer}/fmi/data/vLatest/databases/${encodeURIComponent(dbName)}${path}`;
  }

  private layoutPath(layout: string, path = ''): string {
    return `/layouts/${encodeURIComponent(layout)}${path}`;
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

    const url = this.databaseUrl(dbName, '/sessions');
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
   * Único punto de salida hacia la Data API para operaciones con token:
   * reutiliza (u obtiene) el token de la BD, reautentica una sola vez si
   * FileMaker responde 401 (token expirado o inválido) y convierte cualquier
   * error de FileMaker en una excepción, en vez de devolverlo como datos.
   * @param noRecordsResult Si se indica, el código FM 401 ("no records match")
   * se devuelve como este resultado vacío en lugar de lanzar.
   */
  private async request<T>(
    dbName: string,
    path: string,
    init: RequestInit,
    noRecordsResult?: T,
  ): Promise<T> {
    const send = async (): Promise<Response> => {
      const token = await this.authFileMaker(dbName);
      return this.fetchWithTimeout(this.databaseUrl(dbName, path), {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${token}` },
      });
    };

    let response: Response;
    try {
      response = await send();
      if (response.status === 401) {
        this.tokens.delete(dbName);
        response = await send();
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('No se pudo conectar con FileMaker', error as Error, {
        tenant: dbName,
        path,
      });
      throw new InternalServerErrorException(
        'No se pudo conectar con FileMaker',
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    if (response.ok) return body as T;

    const fmMessage = (body as FileMakerErrorBody | undefined)?.messages?.[0];
    if (
      noRecordsResult !== undefined &&
      fmMessage?.code === FM_NO_RECORDS_MATCH
    ) {
      return noRecordsResult;
    }

    this.logger.error(
      `FileMaker respondió ${response.status} (código ${fmMessage?.code ?? 'desconocido'}) en ${init.method} ${path}`,
      undefined,
      {
        tenant: dbName,
        status: response.status,
        fmCode: fmMessage?.code,
        fmMessage: fmMessage?.message,
      },
    );
    throw new InternalServerErrorException(
      'Error al comunicarse con FileMaker',
    );
  }

  private emptyFindResult(dbName: string, layout: string): FindRecordsResult {
    return {
      response: {
        data: [],
        dataInfo: {
          database: dbName,
          layout,
          table: '',
          totalRecordCount: 0,
          foundCount: 0,
          returnedCount: 0,
        },
      },
    };
  }

  /**
   * Obtiene todos los registros de una base de datos y layout.
   * @param dbName El nombre de la base de datos en FileMaker.
   * @param layout El nombre del layout en FileMaker.
   * @param limit Máximo de registros (la Data API devuelve 100 si no se indica).
   * @returns Promise<FindRecordsResult> El resultado de la búsqueda.
   */
  async getAllRecords(
    dbName: string,
    layout: string,
    limit?: number,
  ): Promise<FindRecordsResult> {
    return this.request<FindRecordsResult>(
      dbName,
      this.layoutPath(layout, limit ? `/records?_limit=${limit}` : '/records'),
      { method: 'GET' },
      this.emptyFindResult(dbName, layout),
    );
  }

  /**
   * Realiza una búsqueda de registros en FileMaker.
   * @param dbName El nombre de la base de datos en FileMaker donde se realizará la búsqueda.
   * @param layout El nombre del layout en FileMaker donde se realizará la búsqueda.
   * @param query Un array de objetos que representan los criterios de búsqueda. Cada objeto debe tener la estructura { fieldName: value }.
   * @param offset El número de registro desde el cual comenzar a devolver resultados (paginación). Por defecto es 1.
   * @param limit El número máximo de registros a devolver. Por defecto es 50.
   * @returns Promise<FindRecordsResult> El resultado de la búsqueda; vacío si ningún registro coincide.
   */
  async findRecords(
    dbName: string,
    layout: string,
    query: FileMakerCondition[],
    offset: number = 1,
    limit: number = 50,
  ): Promise<FindRecordsResult> {
    const result = await this.request<FindRecordsResult>(
      dbName,
      this.layoutPath(layout, '/_find'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, offset, limit }),
      },
      this.emptyFindResult(dbName, layout),
    );
    this.logger.log(
      `Búsqueda realizada en la base de datos ${dbName} con layout ${layout}. Registros: ${result?.response?.data?.length ?? 0}`,
    );
    return result;
  }

  async getRecord(
    dbName: string,
    layout: string,
    recordId: string,
  ): Promise<GetRecordResponse> {
    return this.request<GetRecordResponse>(
      dbName,
      this.layoutPath(layout, `/records/${encodeURIComponent(recordId)}`),
      { method: 'GET' },
    );
  }

  async createRecord(
    dbName: string,
    layout: string,
    fieldData: Record<string, unknown>,
  ): Promise<CreateRecordResponse> {
    const result = await this.request<CreateRecordResponse>(
      dbName,
      this.layoutPath(layout, '/records'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldData }),
      },
    );
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
    const result = await this.request<EditRecordResponse>(
      dbName,
      this.layoutPath(layout, `/records/${encodeURIComponent(recordId)}`),
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldData }),
      },
    );
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
    await this.request<unknown>(
      dbName,
      this.layoutPath(layout, `/records/${encodeURIComponent(recordId)}`),
      { method: 'DELETE' },
    );
    this.logger.log(
      `Registro ${recordId} eliminado en la base de datos ${dbName}`,
    );
  }
}
