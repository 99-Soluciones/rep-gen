import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import type {
  FileMakerCondition,
  RawRecord,
} from '../../../filemaker/ifilemaker';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';
import type {
  DetalleIngresos,
  ReportCashInflowRecord,
} from '../../domain/cash-inflows';
import {
  BAN,
  CONCEPTOS,
  LAYOUT_BANCOS,
  LAYOUT_PAGOS,
  PAGOS_VENTA,
  buildBancosQuery,
  buildPagosQuery,
  cleanCashInflowsData,
} from '../../infrastructure/cash-inflows';
import { getBankBaseFilters } from '../../infrastructure/banks/banks.permissions.filter';
import type { DateRange, ReportResponse } from '../shared/base-report.service';
import { fetchCached } from '../shared/report-cache';
import { cleanOrThrow, findAllRecords } from '../shared/report-query';

// ponytail: tope por portal; una venta con más pagos o conceptos se recortaría.
const PORTAL_LIMIT = 99999;

type Crudos = { pagos: RawRecord[]; bancos: RawRecord[] };

/**
 * Flujo de efectivo - Ingresos: pagos aplicados a facturas en el rango
 * (prorrateados por lo pagado) más los depósitos del rango sin aplicar.
 */
@Injectable()
export class GetCashInflowsReportUseCase {
  private readonly inFlight = new Map<string, Promise<Crudos>>();

  constructor(
    private readonly fileMakerService: FileMakerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly bankPermissions: GetBankPermissionsUseCase,
    private readonly logger: LoggerService,
  ) {}

  async fetchReport(
    dateRange: DateRange,
    detalle: DetalleIngresos,
    dbName: string,
    user: number,
    refresh: boolean = false,
  ): Promise<ReportResponse<ReportCashInflowRecord>> {
    if (dateRange.startDate > dateRange.endDate) {
      throw new BadRequestException(
        'startDate no puede ser posterior a endDate',
      );
    }

    // Se cachea lo crudo: las dos vistas comparten una sola consulta a
    // FileMaker. El usuario va en la clave: los permisos de bancos son suyos.
    const key = `ingresos_${dateRange.startDate}_${dateRange.endDate}_${dbName}_${user}`;
    const load = async (): Promise<Crudos> => {
      const permisos = await getBankBaseFilters(
        this.bankPermissions,
        dbName,
        user,
        BAN.banco,
      );
      const [pagos, bancos] = await Promise.all([
        this.find(dbName, LAYOUT_PAGOS, buildPagosQuery(dateRange), {
          [PAGOS_VENTA.portal]: PORTAL_LIMIT,
          [CONCEPTOS.portal]: PORTAL_LIMIT,
        }),
        this.find(dbName, LAYOUT_BANCOS, buildBancosQuery(dateRange, permisos)),
      ]);
      return { pagos, bancos };
    };
    const { pagos, bancos } = await fetchCached(
      this.cacheManager,
      this.inFlight,
      key,
      load,
      refresh,
    );

    return cleanOrThrow(
      this.logger,
      { tenant: dbName, report: 'flujo-efectivo-ingresos' },
      () => ({
        data: cleanCashInflowsData(pagos, bancos, dateRange, detalle),
      }),
    );
  }

  private find(
    dbName: string,
    layout: string,
    query: FileMakerCondition[],
    portalLimits: Record<string, number> = {},
  ) {
    return findAllRecords(
      this.fileMakerService,
      this.logger,
      dbName,
      layout,
      query,
      portalLimits,
    );
  }
}
