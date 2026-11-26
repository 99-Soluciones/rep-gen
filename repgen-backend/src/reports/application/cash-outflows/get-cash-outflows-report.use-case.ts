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
  DetalleEgresos,
  ReportCashOutflowRecord,
} from '../../domain/cash-outflows';
import {
  BAN,
  CONCEPTOS,
  LAYOUT_BANCOS,
  LAYOUT_PAGOS,
  PAGOS_COMPRA,
  buildBancosQuery,
  buildPagosQuery,
  cleanCashOutflowsData,
} from '../../infrastructure/cash-outflows';
import { getBankBaseFilters } from '../../infrastructure/banks/banks.permissions.filter';
import type { DateRange, ReportResponse } from '../shared/base-report.service';
import { fetchCached } from '../shared/report-cache';
import { cleanOrThrow, findAllRecords } from '../shared/report-query';

// ponytail: tope por portal; una factura con más pagos o conceptos se recortaría.
const PORTAL_LIMIT = 99999;

type Crudos = { pagos: RawRecord[]; bancos: RawRecord[] };

/**
 * Flujo de efectivo - Egresos: pagos aplicados a facturas de compra en el rango
 * (prorrateados por lo pagado) más los cargos del rango sin aplicar.
 */
@Injectable()
export class GetCashOutflowsReportUseCase {
  private readonly inFlight = new Map<string, Promise<Crudos>>();

  constructor(
    private readonly fileMakerService: FileMakerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly bankPermissions: GetBankPermissionsUseCase,
    private readonly logger: LoggerService,
  ) {}

  async fetchReport(
    dateRange: DateRange,
    detalle: DetalleEgresos,
    dbName: string,
    user: number,
    refresh: boolean = false,
  ): Promise<ReportResponse<ReportCashOutflowRecord>> {
    if (dateRange.startDate > dateRange.endDate) {
      throw new BadRequestException(
        'startDate no puede ser posterior a endDate',
      );
    }

    // Se cachea lo crudo: las dos vistas comparten una sola consulta a
    // FileMaker. El usuario va en la clave: los permisos de bancos son suyos.
    const key = `egresos_${dateRange.startDate}_${dateRange.endDate}_${dbName}_${user}`;
    const load = async (): Promise<Crudos> => {
      const permisos = await getBankBaseFilters(
        this.bankPermissions,
        dbName,
        user,
        BAN.banco,
      );
      const [pagos, bancos] = await Promise.all([
        this.find(dbName, LAYOUT_PAGOS, buildPagosQuery(dateRange), {
          [PAGOS_COMPRA.portal]: PORTAL_LIMIT,
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
      { tenant: dbName, report: 'flujo-efectivo-egresos' },
      () => ({
        data: cleanCashOutflowsData(pagos, bancos, dateRange, detalle),
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
