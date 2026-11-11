import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';
import type { ReceivablesResponse } from '../../domain/receivables';
import {
  APLICACIONES,
  BAN,
  LAYOUT_BANCOS,
  LAYOUT_FACTURAS,
  PAGOS_VENTA,
  buildBancosQuery,
  buildFacturasQuery,
  cleanReceivablesData,
} from '../../infrastructure/receivables';
import { getBankBaseFilters } from '../../infrastructure/banks/banks.permissions.filter';
import { fetchCached } from '../shared/report-cache';
import { cleanOrThrow, findAllRecords } from '../shared/report-query';

// ponytail: tope por portal; una venta o un abono con más aplicaciones se recortaría.
const PORTAL_LIMIT = 99999;

/** Hoy en México (YYYY-MM-DD): el corte por defecto. */
export const hoyEnMexico = (ahora = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(
    ahora,
  );

const esFechaValida = (iso: string): boolean => {
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};

/**
 * Cuentas por cobrar a una fecha de corte: consulta Facturas y Bancos y
 * reconstruye el saldo al cierre de ese día.
 */
@Injectable()
export class GetReceivablesReportUseCase {
  private readonly inFlight = new Map<string, Promise<ReceivablesResponse>>();

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
  ): Promise<ReceivablesResponse> {
    const hoy = hoyEnMexico();
    const corte = fechaCorte ?? hoy;
    if (!esFechaValida(corte)) {
      throw new BadRequestException('fechaCorte no es una fecha válida');
    }
    if (corte > hoy) {
      throw new BadRequestException('fechaCorte no puede ser futura');
    }

    // El usuario va en la clave: los permisos de bancos son por usuario.
    const key = `cxc_${corte}_${dbName}_${user}`;
    const load = async () => {
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

      return cleanOrThrow(
        this.logger,
        { tenant: dbName, report: 'cuentas-por-cobrar' },
        () => ({
          fechaCorte: corte,
          data: cleanReceivablesData(facturas, bancos, corte),
        }),
      );
    };
    return fetchCached(this.cacheManager, this.inFlight, key, load, refresh);
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
