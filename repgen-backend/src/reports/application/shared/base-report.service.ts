import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { LoggerService as NestLoggerService } from '@nestjs/common';
import type { Cache } from '@nestjs/cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import type {
  FileMakerCondition,
  RawRecord,
} from '../../../filemaker/ifilemaker';

/** Rango de fechas inclusivo en formato YYYY-MM-DD (validado en el DTO). */
export type DateRange = { startDate: string; endDate: string };

export type ReportLogger = Required<
  Pick<NestLoggerService, 'log' | 'debug' | 'warn' | 'error'>
> &
  Partial<NestLoggerService>;

/**
 * Respuesta de un reporte: todos los registros del rango de fechas. El
 * frontend filtra, ordena y pagina en el cliente (AG Grid).
 */
export interface ReportResponse<TRecord> {
  data: TRecord[];
}

// Se trae el rango completo de una vez: el filtrado es del lado del cliente.
const FM_FIND_LIMIT = 999999;

/**
 * Configuración de cada reporte: layout de FileMaker, prefijo de caché, campos
 * de fecha sobre los que se aplica el rango, y la función que limpia los datos crudos.
 * @template TRecord El tipo de los registros devueltos en el reporte.
 * @template TPermissions El tipo del caso de uso de permisos (si el reporte filtra por permisos).
 */
export interface ReportConfig<TRecord, TPermissions = void> {
  layoutName: string;
  cachePrefix: string;
  dateField: string[];
  permissionFieldName: string[];
  cleanDataFunction: (rawData: RawRecord[], dateRange: DateRange) => TRecord[];
  permissionFiltersFunction?: (
    permissionsUseCase: TPermissions, // Inyectamos el useCase, NO el fileMakerService
    dbName: string,
    user: number,
    bankFieldName: string,
  ) => Promise<FileMakerCondition[]>;
}

/** YYYY-MM-DD -> MM/DD/YYYY, el formato de fecha que espera el find de FileMaker. */
const toFileMakerDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
};

/**
 * Servicio base para los reportes: arma la consulta a FileMaker (rango de
 * fechas + permisos), maneja la caché y transforma los datos crudos con la
 * función de limpieza de cada reporte.
 */
@Injectable()
export abstract class BaseReportService<TRecord, TPermissions = void> {
  protected readonly fileMakerService: FileMakerService;
  protected readonly cacheManager: Cache;
  protected readonly permissionsUseCase?: TPermissions;
  protected readonly config: ReportConfig<TRecord, TPermissions>;
  private readonly inFlightRequests = new Map<
    string,
    Promise<ReportResponse<TRecord>>
  >();
  protected readonly logger: ReportLogger;
  constructor(
    fileMakerService: FileMakerService,
    cacheManager: Cache,
    permissionsUseCase: TPermissions | null | undefined,
    config: ReportConfig<TRecord, TPermissions>,
    logger: ReportLogger,
  ) {
    this.fileMakerService = fileMakerService;
    this.cacheManager = cacheManager;
    this.permissionsUseCase = permissionsUseCase ?? undefined;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Obtiene de FileMaker todos los registros del rango de fechas que el usuario
   * tiene permitido ver, ya limpios. Cachea por tenant + usuario + rango.
   */
  async fetchReport(
    dateRange: DateRange,
    dbName: string,
    user: number,
  ): Promise<ReportResponse<TRecord>> {
    // El usuario forma parte de la clave: los permisos (p. ej. bancos) son por usuario.
    const cacheKey = `${this.config.cachePrefix}${this.config.layoutName}_${dateRange.startDate}_${dateRange.endDate}_${dbName}_${user}`;
    const cacheData =
      await this.cacheManager.get<ReportResponse<TRecord>>(cacheKey);

    if (cacheData) {
      return cacheData;
    }
    const inFlightRequest = this.inFlightRequests.get(cacheKey);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    const requestPromise = (async (): Promise<ReportResponse<TRecord>> => {
      const fmQuery = await this.buildQuery(dateRange, dbName, user);

      this.logger.debug('Consulta construida para FileMaker', {
        tenant: dbName,
        layout: this.config.layoutName,
        queryConditions: fmQuery.length,
      });
      const fmResponse = await this.fileMakerService.findRecords(
        dbName,
        this.config.layoutName,
        fmQuery,
        1,
        FM_FIND_LIMIT,
        'reportes',
      );

      const rawData = fmResponse.response.data ?? [];
      const foundCount = fmResponse.response.dataInfo?.foundCount ?? 0;
      if (foundCount > rawData.length) {
        this.logger.warn(
          'Reporte truncado: FileMaker encontró más registros de los devueltos',
          {
            tenant: dbName,
            layout: this.config.layoutName,
            foundCount,
            returned: rawData.length,
          },
        );
      }

      const response: ReportResponse<TRecord> = {
        data: rawData.length ? this.cleanData(rawData, dateRange, dbName) : [],
      };

      await this.cacheManager.set(cacheKey, response);
      this.logger.log(
        `Datos obtenidos de FileMaker y cacheados con la clave ${cacheKey}. Registros encontrados: ${foundCount}`,
      );
      return response;
    })();

    this.inFlightRequests.set(cacheKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  /**
   * Un registro que no cumple el esquema es un problema de datos del servidor,
   * no del cliente: se registra y se responde 500 en vez de devolver un reporte
   * incompleto (faltarían filas en los totales).
   */
  private cleanData(
    rawData: RawRecord[],
    dateRange: DateRange,
    dbName: string,
  ): TRecord[] {
    try {
      return this.config.cleanDataFunction(rawData, dateRange);
    } catch (error) {
      this.logger.error('Registro de FileMaker con formato inesperado', error, {
        tenant: dbName,
        layout: this.config.layoutName,
      });
      throw new InternalServerErrorException(
        'Los datos de FileMaker tienen un formato inesperado',
      );
    }
  }

  /**
   * Construye la consulta de FileMaker: cada request se combina con OR, así que
   * se genera una condición por cada permiso × cada campo de fecha.
   */
  private async buildQuery(
    dateRange: DateRange,
    dbName: string,
    user: number,
  ): Promise<FileMakerCondition[]> {
    let conditions: FileMakerCondition[] = [{}];
    if (this.config.permissionFiltersFunction && this.permissionsUseCase) {
      const permissionConditions = await this.config.permissionFiltersFunction(
        this.permissionsUseCase,
        dbName,
        user,
        this.config.permissionFieldName[0],
      );
      if (permissionConditions.length > 0) conditions = permissionConditions;
    }

    const range = `${toFileMakerDate(dateRange.startDate)}...${toFileMakerDate(dateRange.endDate)}`;
    return conditions.flatMap((condition) =>
      this.config.dateField.map((field) => ({ ...condition, [field]: range })),
    );
  }
}
