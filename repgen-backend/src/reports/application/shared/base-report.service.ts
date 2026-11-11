import { BadRequestException, Injectable } from '@nestjs/common';
import type { LoggerService as NestLoggerService } from '@nestjs/common';
import type { Cache } from '@nestjs/cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import type {
  FileMakerCondition,
  RawRecord,
} from '../../../filemaker/ifilemaker';
import { toFileMakerDate } from '../../../common/utils';
import { fetchCached } from './report-cache';
import { cleanOrThrow, findAllRecords } from './report-query';

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
   * tiene permitido ver, ya limpios. Cachea por tenant + usuario + rango;
   * `refresh` ignora la caché.
   */
  async fetchReport(
    dateRange: DateRange,
    dbName: string,
    user: number,
    refresh = false,
  ): Promise<ReportResponse<TRecord>> {
    if (dateRange.startDate > dateRange.endDate) {
      throw new BadRequestException(
        'startDate no puede ser posterior a endDate',
      );
    }
    // El usuario forma parte de la clave: los permisos (p. ej. bancos) son por usuario.
    const cacheKey = `${this.config.cachePrefix}${this.config.layoutName}_${dateRange.startDate}_${dateRange.endDate}_${dbName}_${user}`;

    return fetchCached(
      this.cacheManager,
      this.inFlightRequests,
      cacheKey,
      async () => {
        const fmQuery = await this.buildQuery(dateRange, dbName, user);

        this.logger.debug('Consulta construida para FileMaker', {
          tenant: dbName,
          layout: this.config.layoutName,
          queryConditions: fmQuery.length,
        });
        const rawData = await findAllRecords(
          this.fileMakerService,
          this.logger,
          dbName,
          this.config.layoutName,
          fmQuery,
        );

        this.logger.log(
          `Datos obtenidos de FileMaker para la clave ${cacheKey}. Registros: ${rawData.length}`,
        );
        return {
          data: rawData.length
            ? cleanOrThrow(
                this.logger,
                { tenant: dbName, layout: this.config.layoutName },
                () => this.config.cleanDataFunction(rawData, dateRange),
              )
            : [],
        };
      },
      refresh,
    );
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
