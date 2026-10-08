import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import { cleanData, salesFieldMapJson } from '../../infrastructure/sales';
import { BaseReportService } from '../shared/base-report.service';
import { ReportSalesRecord } from '../../domain/sales';
import { LoggerService } from '../../../common/logger';
@Injectable()
export class GetSalesReportUseCase extends BaseReportService<ReportSalesRecord> {
  constructor(
    fmService: FileMakerService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: LoggerService,
  ) {
    const data = salesFieldMapJson.data;
    super(
      fmService,
      cacheManager,
      null,
      {
        layoutName: 'apiExport_Venta',
        cachePrefix: 'ventas_',
        dateField: [
          data.fechaTimbradoFactura,
          data.fechaCancelacionCfdi,
          data.devolucion.fechaTimbreCfdi,
        ],
        permissionFieldName: [],
        cleanDataFunction: cleanData,
      },
      logger,
    );
  }
}
