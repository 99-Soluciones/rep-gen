import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import type { ReportBankRecord } from '../../domain/banks';

import { BaseReportService } from '../shared/base-report.service';
import { FileMakerService } from '../../../filemaker/filemaker.service';

import { cleanData, bankFieldMapJson } from '../../infrastructure/banks';
import { getBankBaseFilters } from '../../infrastructure/banks/banks.permissions.filter';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';
@Injectable()
export class GetBankReportUseCase extends BaseReportService<
  ReportBankRecord,
  GetBankPermissionsUseCase
> {
  constructor(
    fmService: FileMakerService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    permissionsUseCase: GetBankPermissionsUseCase,
    logger: LoggerService,
  ) {
    super(
      fmService,
      cacheManager,
      permissionsUseCase,
      {
        layoutName: 'apiExport_bancoITM',
        cachePrefix: 'bancosITM_',
        dateField: [bankFieldMapJson.data.fecha],
        permissionFieldName: [bankFieldMapJson.data.banco.nombre],
        cleanDataFunction: cleanData,
        permissionFiltersFunction: getBankBaseFilters,
      },
      logger,
    );
  }
}
