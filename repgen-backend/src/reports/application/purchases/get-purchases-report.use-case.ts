import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import type { ReportPurchaseRecord } from '../../domain/purchases';
import { BaseReportService } from '../shared/base-report.service';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import {
  COMPRA,
  LAYOUT,
  cleanPurchasesData,
} from '../../infrastructure/purchases';
import { LoggerService } from '../../../common/logger';

/** Compras (general): compras aprobadas en el rango, sin permisos por usuario. */
@Injectable()
export class GetPurchasesReportUseCase extends BaseReportService<ReportPurchaseRecord> {
  constructor(
    fmService: FileMakerService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: LoggerService,
  ) {
    super(
      fmService,
      cacheManager,
      null,
      {
        layoutName: LAYOUT,
        cachePrefix: 'compras_',
        dateField: [COMPRA.fechaAprobado],
        permissionFieldName: [],
        cleanDataFunction: cleanPurchasesData,
      },
      logger,
    );
  }
}
