import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import type { ReportPurchaseItemRecord } from '../../domain/purchase-items';
import { BaseReportService } from '../shared/base-report.service';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import {
  COMPRA,
  LAYOUT,
  cleanPurchaseItemsData,
} from '../../infrastructure/purchase-items';
import { LoggerService } from '../../../common/logger';

/** Compras por concepto: compras aprobadas en el rango, sin permisos por usuario. */
@Injectable()
export class GetPurchaseItemsReportUseCase extends BaseReportService<ReportPurchaseItemRecord> {
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
        cachePrefix: 'comprasConceptos_',
        dateField: [COMPRA.fechaAprobado],
        permissionFieldName: [],
        cleanDataFunction: cleanPurchaseItemsData,
      },
      logger,
    );
  }
}
