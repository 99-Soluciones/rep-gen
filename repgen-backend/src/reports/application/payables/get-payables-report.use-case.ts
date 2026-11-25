import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';
import type {
  FileMakerCondition,
  RawRecord,
} from '../../../filemaker/ifilemaker';
import type { PayablesResponse } from '../../domain/payables';
import {
  APLICACIONES,
  BAN,
  LAYOUT_BANCOS,
  LAYOUT_FACTURAS,
  PAGOS_COMPRA,
  buildBancosQuery,
  buildFacturasQuery,
  cleanPayablesData,
} from '../../infrastructure/payables';
import { getBankBaseFilters } from '../../infrastructure/banks/banks.permissions.filter';
import { fetchCached } from '../shared/report-cache';
import { cleanOrThrow, findAllRecords } from '../shared/report-query';
import { validarCorte } from '../shared/report-corte';

// ponytail: tope por portal; una compra o un cargo con más aplicaciones se recortaría.
const PORTAL_LIMIT = 99999;

type Crudos = { facturas: RawRecord[]; bancos: RawRecord[] };

/**
 * Cuentas por pagar a una fecha de corte: consulta Facturas (compras) y
 * Bancos y reconstruye el saldo al cierre de ese día.
 * Ficha: docs/reports/fichas/payables/payables.md
 */
@Injectable()
export class GetPayablesReportUseCase {
  private readonly inFlight = new Map<string, Promise<Crudos>>();

  constructor(
    private readonly fileMakerService: FileMakerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly bankPermissions: GetBankPermissionsUseCase,
    private readonly logger: LoggerService,
  ) {}

  async fetchReport(
    fechaCorte: string | undefined,
    dbName: string,
    user: number,
    refresh: boolean = false,
  ): Promise<PayablesResponse> {
    const corte = validarCorte(fechaCorte);
    // El usuario va en la clave: los permisos de bancos son suyos.
    const key = `cxp_${corte}_${dbName}_${user}`;
    const load = async (): Promise<Crudos> => {
      const permisos = await getBankBaseFilters(
        this.bankPermissions,
        dbName,
        user,
        BAN.banco,
      );
      const [facturas, bancos] = await Promise.all([
        this.find(dbName, LAYOUT_FACTURAS, buildFacturasQuery(corte), {
          [PAGOS_COMPRA.portal]: PORTAL_LIMIT,
        }),
        this.find(dbName, LAYOUT_BANCOS, buildBancosQuery(corte, permisos), {
          [APLICACIONES.ingreso.portal]: PORTAL_LIMIT,
          [APLICACIONES.egreso.portal]: PORTAL_LIMIT,
        }),
      ]);
      return { facturas, bancos };
    };
    const { facturas, bancos } = await fetchCached(
      this.cacheManager,
      this.inFlight,
      key,
      load,
      refresh,
    );
    return {
      fechaCorte: corte,
      data: cleanOrThrow(
        this.logger,
        { tenant: dbName, report: 'cuentas-por-pagar' },
        () => cleanPayablesData(facturas, bancos, corte),
      ),
    };
  }

  private find(
    dbName: string,
    layout: string,
    query: FileMakerCondition[],
    portalLimits: Record<string, number>,
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
