import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { FilterBankModel, ReportBankRecord } from '../../domain/banks';

import { BaseReportService } from '../shared/base-report.service';
import { FileMakerService } from '../../../filemaker/filemaker.service';

import { cleanData, bankFieldMapJson } from '../../infrastructure/banks';
import { getBankBaseFilters } from '../../infrastructure/banks/banks.permissions.filter';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';
@Injectable()
export class GetBankReportUseCase extends BaseReportService<
  FilterBankModel,
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
        fieldMapping: {
          fecha: bankFieldMapJson.data.fecha,
          formaPago: bankFieldMapJson.data.formaPago,
          concepto: bankFieldMapJson.data.concepto,
          abono: bankFieldMapJson.data.abono,
          cargo: bankFieldMapJson.data.cargo,
          saldoPorComplementar: bankFieldMapJson.data.saldoPorComplementar,
          tipoDeCambio: bankFieldMapJson.data.tipoDeCambio,
          saldoPorIdentificar: bankFieldMapJson.data.saldoPorIdentificar,
          textoComplementario: bankFieldMapJson.data.textoComplementario,
          nombre_banco: bankFieldMapJson.data.banco?.nombre,
          numero_cuenta: bankFieldMapJson.data.banco?.cuentaNumero,
          moneda: bankFieldMapJson.data.banco?.moneda,
          estadoIngreso: bankFieldMapJson.data.ingreso?.estado,
          estadoEgreso: bankFieldMapJson.data.egreso?.estado,
          nombre_comercial: [
            bankFieldMapJson.data.cliente.ingreso?.nombreComercial,
            bankFieldMapJson.data.cliente.ingreso?.nombreComercial,
            bankFieldMapJson.data.cliente.egreso?.nombreComercial,
            bankFieldMapJson.data.cliente.egreso?.nombreComercial,
          ],
          rfc: [
            bankFieldMapJson.data.cliente.ingreso?.rfc,
            bankFieldMapJson.data.cliente.ingreso?.rfc,
            bankFieldMapJson.data.cliente.egreso?.rfc,
            bankFieldMapJson.data.cliente.egreso?.rfc,
          ],
        },
        globalSearchFields: [
          bankFieldMapJson.data.banco.nombre,
          bankFieldMapJson.data.banco.cuentaNumero,
          bankFieldMapJson.data.banco.moneda,
        ],
        cleanDataFunction: cleanData,
        permissionFiltersFunction: getBankBaseFilters,
      },
      logger,
    );
  }
}
