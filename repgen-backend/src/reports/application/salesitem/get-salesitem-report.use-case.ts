import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import type { ReportSalesItemRecord } from '../../domain/salesitem';

import { BaseReportService } from '../shared/base-report.service';
import { FileMakerService } from '../../../filemaker/filemaker.service';

import {
  cleanData,
  salesitemFieldMapJson,
} from '../../infrastructure/salesitem';
import { LoggerService } from '../../../common/logger';

@Injectable()
export class GetSalesitemReportUseCase extends BaseReportService<ReportSalesItemRecord> {
  constructor(
    fmService: FileMakerService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: LoggerService,
  ) {
    const data = salesitemFieldMapJson.data;

    super(
      fmService,
      cacheManager,
      null,
      {
        layoutName: 'apiExport_VentaITM',
        cachePrefix: 'ventaITM',
        dateField: [
          data.venta.fechaTimbrado,
          data.venta.fechaCancelacion,
          data.devolucion.fechaTimbrado,
        ],
        permissionFieldName: [],
        cleanDataFunction: cleanData,
      },
      logger,
    );
  }
}
