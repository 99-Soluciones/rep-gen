import { Injectable } from '@nestjs/common';
import type { LoggerService as NestLoggerService } from '@nestjs/common';
import type { Cache } from '@nestjs/cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import type {
  FindRecordsResult,
  FileMakerCondition,
} from '../../../filemaker/ifilemaker';
import { RawRecord } from '../../../filemaker/ifilemaker';
import { FilterModel } from '../../domain/reports.types';
type DateRange = { startDate: string; endDate: string };

export type ReportLogger = Required<
  Pick<NestLoggerService, 'log' | 'debug' | 'warn' | 'error'>
> &
  Partial<NestLoggerService>;

/**
 * Interfaz para la respuesta paginada de los reportes.
 * @template TRecord El tipo de los registros devueltos en el reporte.
 */
export interface PaginatedResponse<TRecord> {
  data: TRecord[];
  meta: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
  };
}

/**
 * Configuración genérica para los servicios de reporte, que incluye el nombre del layout de FileMaker,
 * el prefijo para cachear resultados, el campo de fecha para filtros, el mapeo de campos y
 * la función para limpiar datos crudos.
 * @template TFilterModel El tipo del modelo de filtros específico para cada reporte.
 * @template TRecord El tipo de los registros devueltos en el reporte.
 * @template TPermissions El tipo de los permisos para el reporte.
 */
export interface ReportConfig<
  TFilterModel extends object,
  TRecord,
  TPermissions = void,
> {
  layoutName: string;
  cachePrefix: string;
  dateField: string[];
  permissionFieldName: string[];
  fieldMapping: Partial<
    Record<Extract<keyof TFilterModel, string>, string | string[]>
  >;
  globalSearchFields: string[];
  cleanDataFunction: (rawData: RawRecord[], dateRange: DateRange) => TRecord[];
  postFilterFunction?: (
    records: TRecord[],
    filterModel: TFilterModel,
  ) => TRecord[];
  permissionFiltersFunction?: (
    permissionsUseCase: TPermissions, // Inyectamos el useCase, NO el fileMakerService
    dbName: string,
    user: number,
    bankFieldName: string,
  ) => Promise<FileMakerCondition[]>;
}

/**
 * Servicio base para los reportes, que proporciona la lógica común para interactuar con FileMaker,
 * aplicar filtros, manejar la caché y transformar los datos crudos en un formato adecuado para los reportes específicos.
 * Este servicio es abstracto y debe ser extendido por servicios de reporte específicos que proporcionen su propia configuración y lógica de limpieza de datos.
 */
@Injectable()
export abstract class BaseReportService<
  TFilterModel extends object,
  TRecord,
  TPermissions = void,
> {
  protected readonly fileMakerService: FileMakerService;
  protected readonly cacheManager: Cache;
  protected readonly permissionsUseCase?: TPermissions;
  protected readonly config: ReportConfig<TFilterModel, TRecord, TPermissions>;
  private readonly inFlightRequests = new Map<
    string,
    Promise<PaginatedResponse<TRecord>>
  >();
  protected readonly logger: ReportLogger;
  constructor(
    fileMakerService: FileMakerService,
    cacheManager: Cache,
    permissionsUseCase: TPermissions | null | undefined,
    config: ReportConfig<TFilterModel, TRecord, TPermissions>,
    logger: ReportLogger,
  ) {
    this.fileMakerService = fileMakerService;
    this.cacheManager = cacheManager;
    this.permissionsUseCase = permissionsUseCase ?? undefined;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Función para obtener datos de FileMaker aplicando filtros, búsqueda global y rango de fechas.
   * Esta función maneja la lógica de construcción de la consulta para FileMaker,
   * @param offSet El número de registro desde el cual comenzar a devolver resultados (paginación). De momento no se utiliza, pero se deja para futuras implementaciones de paginación.
   * @param limit El número máximo de registros a devolver (paginación).De momento no se utiliza, pero se deja para futuras implementaciones de paginación.
   * @param globalSearch Valor de búsqueda global que se aplicará a los campos definidos en la configuración.
   * @param filterModel Modelo de filtros que se aplicará a los campos definidos en la configuración.
   * @param dateRange Rango de fechas para filtrar los registros.
   * @returns Promise<PaginatedResponse<TRecord>> La respuesta paginada con los registros encontrados.
   */
  async fetchFromFileMakerWithFilters(
    offSet: number,
    limit: number,
    globalSearch: string,
    filterModel: TFilterModel,
    dateRange: DateRange,
    dbName: string,
    user: number,
  ): Promise<PaginatedResponse<TRecord>> {
    const cacheKey = `${this.config.cachePrefix}${this.config.layoutName}_${globalSearch}_${JSON.stringify(filterModel)}_${JSON.stringify(dateRange)}_${offSet}_${limit}_${dbName}`;
    const cacheData =
      await this.cacheManager.get<PaginatedResponse<TRecord>>(cacheKey);

    if (cacheData) {
      return cacheData;
    }
    const inFlightRequest = this.inFlightRequests.get(cacheKey);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    const requestPromise = (async (): Promise<PaginatedResponse<TRecord>> => {
      const fmQuery = await this.makeFilterString(
        globalSearch,
        filterModel,
        dateRange,
        dbName,
        user,
      );

      if (fmQuery.length === 0) {
        const emptyResponse: PaginatedResponse<TRecord> = {
          data: [],
          meta: {
            totalRecords: 0,
            currentPage: 1,
            totalPages: 1,
          },
        };
        await this.cacheManager.set(cacheKey, emptyResponse);
        this.logger.log(
          `Consulta sin coincidencias por filtros/permisos. CacheKey ${cacheKey}.`,
        );
        return emptyResponse;
      }

      this.logger.debug('Consulta construida para FileMaker', {
        tenant: dbName,
        layout: this.config.layoutName,
        queryConditions: fmQuery.length,
      });
      const fmResponse: FindRecordsResult =
        await this.fileMakerService.findRecords(
          dbName,
          this.config.layoutName,
          fmQuery,
          offSet,
          limit,
        );

      if (!fmResponse || !fmResponse.response) {
        this.logger.error('Respuesta inválida de FileMaker', undefined, {
          tenant: dbName,
          layout: this.config.layoutName,
          cacheKey,
          queryConditions: fmQuery.length,
          hasResponse: Boolean(fmResponse?.response),
        });
        throw new Error('Respuesta inválida de FileMaker');
      }
      const rawData = fmResponse.response.data;
      const foundCount =
        fmResponse.response.dataInfo?.foundCount ||
        fmResponse.response.data?.length ||
        0;
      const currentPage = limit > 0 ? Math.floor((offSet - 1) / limit) + 1 : 1;
      const totalPages =
        limit > 0 && foundCount > 0 ? Math.ceil(foundCount / limit) : 1;

      const response: PaginatedResponse<TRecord> = rawData?.length
        ? (() => {
            const cleaned = this.config.cleanDataFunction(rawData, dateRange);
            const finalData = this.config.postFilterFunction
              ? this.config.postFilterFunction(cleaned, filterModel)
              : cleaned;

            return {
              data: finalData,
              meta: {
                totalRecords: foundCount,
                currentPage: currentPage,
                totalPages: totalPages,
              },
            };
          })()
        : {
            data: [],
            meta: {
              totalRecords: 0,
              currentPage: 1,
              totalPages: 1,
            },
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
   * Función para construir la consulta de FileMaker a partir de los filtros proporcionados,
   *  la búsqueda global y el rango de fechas.
   * @param globalSearch Valor de búsqueda global que se aplicará a los campos definidos en la configuración.
   * @param filterModel Modelo de filtros que se aplicará a los campos definidos en la configuración.
   * @param dateRange Rango de fechas para filtrar los registros.
   * @param permissions Permisos de acceso a los bancos que se pueden utilizar para construir filtros específicos basados en los permisos del usuario.
   * @returns Query construida para FileMaker, que es un array de condiciones que se aplicarán en la búsqueda.
   */
  private async makeFilterString(
    globalSearch: string,
    filterModel: TFilterModel,
    dateRange: DateRange,
    dbName: string,
    user: number,
  ): Promise<FileMakerCondition[]> {
    let queryConditions: FileMakerCondition[] = [];
    let userFiltersApplied = false;
    if (!this.config.permissionFiltersFunction && !this.permissionsUseCase) {
      this.logger.debug(
        'No se proporcionó una función de filtros de permisos o un caso de uso de permisos. Se omitirán los filtros basados en permisos.',
      );
    } else {
      if (this.config.permissionFiltersFunction && this.permissionsUseCase) {
        queryConditions = await this.config.permissionFiltersFunction(
          this.permissionsUseCase,
          dbName,
          user,
          this.config.permissionFieldName[0],
        );
      }
    }

    if (!queryConditions || queryConditions.length === 0) {
      queryConditions = [{}];
    }

    let formatDate: (dateISO: string) => string = () => '';
    if (dateRange.startDate && dateRange.endDate) {
      formatDate = (dateISO: string) => {
        if (!dateISO) return '';
        const [year, month, day] = dateISO.split('-');
        return `${month}/${day}/${year}`;
      };
    }

    const fmStartDate = formatDate(dateRange.startDate);
    const fmEndDate = formatDate(dateRange.endDate);

    if (fmStartDate && fmEndDate) {
      const dateRangeValue = `${fmStartDate}...${fmEndDate}`;
      const expandedDateConditions: FileMakerCondition[] = [];

      queryConditions.forEach((condition) => {
        this.config.dateField.forEach((dateField) => {
          expandedDateConditions.push({
            ...condition,
            [dateField]: dateRangeValue,
          });
        });
      });

      if (expandedDateConditions.length > 0) {
        queryConditions = expandedDateConditions;
      }
    }

    const matchesExistingFilter = (
      conditionValue: string | number | undefined,
      candidateValue: string | number,
    ): boolean => {
      const conditionRaw = String(conditionValue ?? '');
      const candidateRaw = String(candidateValue);

      if (candidateRaw === '=') {
        return conditionRaw === '' || conditionRaw === '=';
      }

      if (candidateRaw.startsWith('>') || candidateRaw.startsWith('<')) {
        return conditionRaw === candidateRaw;
      }

      const normalizedCondition = conditionRaw.replace(/^=+/, '');
      if (candidateRaw.includes('*')) {
        const token = candidateRaw.replace(/^=+/, '').replace(/\*/g, '');
        if (!token) return true;
        return normalizedCondition.toLowerCase().includes(token.toLowerCase());
      }

      const normalizedCandidate = candidateRaw.replace(/^=+/, '');
      return (
        normalizedCondition.toLowerCase() === normalizedCandidate.toLowerCase()
      );
    };

    // 3. APLICAR FILTROS DEL USUARIO
    if (filterModel && Object.keys(filterModel).length > 0) {
      Object.entries(filterModel as Record<string, unknown>).forEach(
        ([key, filterInfo]) => {
          const typedKey = key as Extract<keyof TFilterModel, string>;
          const fmMappedField = this.config.fieldMapping[typedKey];
          if (!fmMappedField || !filterInfo) return;

          const typedFilterInfo = filterInfo as FilterModel;
          let filterValue: string | number | null = null;

          if (typedFilterInfo.filterType === 'text') {
            if (typedFilterInfo.type === 'empty') filterValue = '=';
            else if (typedFilterInfo.type === 'equals')
              filterValue = `=${typedFilterInfo.filter}`;
            else if (typedFilterInfo.type === 'contains')
              filterValue = `*${typedFilterInfo.filter}*`;
          } else if (typedFilterInfo.filterType === 'number') {
            if (typedFilterInfo.type === 'greaterThan')
              filterValue = `>${typedFilterInfo.filter}`;
            else if (typedFilterInfo.type === 'lessThan')
              filterValue = `<${typedFilterInfo.filter}`;
            else if (typedFilterInfo.type === 'equals')
              filterValue = `${typedFilterInfo.filter}`;
            else if (typedFilterInfo.type === 'empty') filterValue = '=';
          }
          if (filterValue === null) return;
          userFiltersApplied = true;

          const fmFields: string[] = Array.isArray(fmMappedField)
            ? fmMappedField
            : [fmMappedField];

          const expandedConditions: FileMakerCondition[] = [];
          for (const condition of queryConditions) {
            let pushedOriginal = false;

            for (const fmField of fmFields) {
              if (Object.prototype.hasOwnProperty.call(condition, fmField)) {
                if (
                  !pushedOriginal &&
                  matchesExistingFilter(condition[fmField], filterValue)
                ) {
                  expandedConditions.push({ ...condition });
                  pushedOriginal = true;
                }
                continue;
              }

              expandedConditions.push({
                ...condition,
                [fmField]: filterValue,
              });
            }
          }

          queryConditions = expandedConditions;
        },
      );
    }

    if (userFiltersApplied && queryConditions.length === 0) {
      return [];
    }

    const finalQuery: FileMakerCondition[] = [];

    if (globalSearch && globalSearch.trim() !== '') {
      const searchLower = globalSearch.trim().toLowerCase();

      queryConditions.forEach((condition) => {
        this.config.globalSearchFields.forEach((field) => {
          if (
            field === this.config.permissionFieldName[0] &&
            condition[field]
          ) {
            const conditionValue = String(condition[field])
              .replace(/^=+/, '')
              .toLowerCase();
            if (conditionValue.includes(searchLower)) {
              finalQuery.push({ ...condition });
            }
            return;
          }
          finalQuery.push({
            ...condition,
            [field]: `*${globalSearch}*`,
          });
        });
      });
    } else {
      finalQuery.push(...queryConditions);
    }

    if (finalQuery.length === 0 || Object.keys(finalQuery[0]).length === 0)
      return [{}];
    return finalQuery;
  }
}
