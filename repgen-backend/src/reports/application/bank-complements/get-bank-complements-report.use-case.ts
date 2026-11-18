import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import type { ReportBankComplementRecord } from '../../domain/bank-complements';
import { BaseReportService } from '../shared/base-report.service';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import {
  BANCO,
  LAYOUT,
  MOV,
  cleanBankComplementsData,
} from '../../infrastructure/bank-complements';
import { getBankBaseFilters } from '../../infrastructure/banks/banks.permissions.filter';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';

/** Bancos con un renglón por complemento; mismos permisos y fecha que Bancos. */
@Injectable()
export class GetBankComplementsReportUseCase extends BaseReportService<
  ReportBankComplementRecord,
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
        layoutName: LAYOUT,
        cachePrefix: 'bancosComplementos_',
        dateField: [MOV.fecha],
        permissionFieldName: [BANCO.nombre],
        cleanDataFunction: cleanBankComplementsData,
        permissionFiltersFunction: getBankBaseFilters,
      },
      logger,
    );
  }
}
