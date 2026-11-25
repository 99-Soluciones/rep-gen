import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type {
  ReceivablesResponse,
  ReportReceivablesClientRecord,
  ReportReceivablesRecord,
} from '../../domain/receivables';
import {
  APLICACIONES,
  BAN,
  LAYOUT_BANCOS,
  LAYOUT_FACTURAS,
  PAGOS_VENTA,
  buildBancosQuery,
  buildFacturasQuery,
  cleanReceivablesData,
  resumirPorCliente,
} from '../../infrastructure/receivables';
import { getBankBaseFilters } from '../../infrastructure/banks/banks.permissions.filter';
import { fetchCached } from '../shared/report-cache';
import { cleanOrThrow, findAllRecords } from '../shared/report-query';
import { validarCorte } from '../shared/report-corte';

// ponytail: tope por portal; una venta o un abono con más aplicaciones se recortaría.
const PORTAL_LIMIT = 99999;

type Crudos = { facturas: RawRecord[]; bancos: RawRecord[] };

/**
 * Cuentas por cobrar a una fecha de corte: consulta Facturas y Bancos y
 * reconstruye el saldo al cierre de ese día. La vista por cliente suma el
 * detalle; las dos comparten la misma consulta en caché.
 */
@Injectable()
export class GetReceivablesReportUseCase {
  private readonly inFlight = new Map<string, Promise<Crudos>>();

  constructor(
    private readonly fileMakerService: FileMakerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly bankPermissions: GetBankPermissionsUseCase,
    private readonly logger: LoggerService,
  ) {}

  /** Detalle por factura y movimiento de banco. */
  async fetchReport(
    fechaCorte: string | undefined,
    dbName: string,
    user: number,
    refresh: boolean = false,
  ): Promise<ReceivablesResponse<ReportReceivablesRecord>> {
    const corte = validarCorte(fechaCorte);
    return {
      fechaCorte: corte,
      data: await this.detalle(corte, dbName, user, refresh),
    };
  }

  /** Resumen: una fila por cliente con saldo, más los no identificados. */
  async fetchClientReport(
    fechaCorte: string | undefined,
    dbName: string,
    user: number,
    refresh: boolean = false,
  ): Promise<ReceivablesResponse<ReportReceivablesClientRecord>> {
    const corte = validarCorte(fechaCorte);
    const filas = await this.detalle(corte, dbName, user, refresh);
    return { fechaCorte: corte, data: resumirPorCliente(filas, corte) };
  }

  private async detalle(
    corte: string,
    dbName: string,
    user: number,
    refresh: boolean,
  ): Promise<ReportReceivablesRecord[]> {
    // Se cachea lo crudo: las dos vistas comparten una sola consulta a
    // FileMaker. El usuario va en la clave: los permisos de bancos son suyos.
    const key = `cxc_${corte}_${dbName}_${user}`;
    const load = async (): Promise<Crudos> => {
      const permisos = await getBankBaseFilters(
        this.bankPermissions,
        dbName,
        user,
        BAN.banco,
      );
      const [facturas, bancos] = await Promise.all([
        this.find(dbName, LAYOUT_FACTURAS, buildFacturasQuery(corte), {
          [PAGOS_VENTA.portal]: PORTAL_LIMIT,
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
    return cleanOrThrow(
      this.logger,
      { tenant: dbName, report: 'cuentas-por-cobrar' },
      () => cleanReceivablesData(facturas, bancos, corte),
    );
  }

  private find(
    dbName: string,
    layout: string,
    query: ReturnType<typeof buildFacturasQuery>,
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
