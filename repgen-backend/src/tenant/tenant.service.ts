import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { LoggerService } from '../common/logger/logger.service';
import { FileMakerService } from '../filemaker/filemaker.service';

import type {
  ColumnLabelsRecord,
  ColumnLabelsResponse,
} from './domain/column-labels';
import type { TenantFeaturesResponse } from './domain/tenant-features';
import { columnLabelsFieldMapJson as fieldMap } from './infrastructure/column-labels-field-map';
import { mapColumnLabelsRecord } from './infrastructure/column-labels.mapper';

const COLUMN_LABELS_CACHE_PREFIX = 'column-labels:';
const COLUMN_LABELS_CACHE_TTL_MS = 10 * 60 * 1000;

const FEATURES_CACHE_PREFIX = 'tenant-features:';
const FEATURES_CACHE_TTL_MS = 10 * 60 * 1000;
const REPORT_CONFIG_LAYOUT = 'api_configReporte';

@Injectable()
export class TenantService {
  constructor(
    private readonly logger: LoggerService,
    private readonly fileMakerService: FileMakerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getColumnLabels(tenantId: string): Promise<ColumnLabelsResponse> {
    if (!tenantId) {
      this.logger.error('Tenant ID is required');
      throw new BadRequestException('Tenant ID is required');
    }

    const cacheKey = `${COLUMN_LABELS_CACHE_PREFIX}${tenantId}`;
    const cached = await this.cacheManager.get<ColumnLabelsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const record = await this.fetchColumnLabelsFromFileMaker(tenantId);
    const response = mapColumnLabelsRecord(record);

    await this.cacheManager.set(cacheKey, response, COLUMN_LABELS_CACHE_TTL_MS);

    this.logger.log(
      `Column labels loaded for tenant ${tenantId}: ${JSON.stringify(response)}`,
    );

    return response;
  }

  async getFeatures(tenantId: string): Promise<TenantFeaturesResponse> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const cacheKey = `${FEATURES_CACHE_PREFIX}${tenantId}`;
    const cached =
      await this.cacheManager.get<TenantFeaturesResponse>(cacheKey);
    if (cached) return cached;

    let reportConfigs = false;
    try {
      const result = await this.fileMakerService.getAllRecords(
        tenantId,
        REPORT_CONFIG_LAYOUT,
      );
      // FM returns undefined data when the layout is missing (HTTP 400 response)
      reportConfigs = result.response.data !== undefined;
    } catch {
      // Network or auth failure — treat feature as unavailable
    }

    const features: TenantFeaturesResponse = { reportConfigs };
    await this.cacheManager.set(cacheKey, features, FEATURES_CACHE_TTL_MS);
    this.logger.log(
      `Tenant features resolved for ${tenantId}: ${JSON.stringify(features)}`,
    );
    return features;
  }

  private async fetchColumnLabelsFromFileMaker(
    tenantId: string,
  ): Promise<ColumnLabelsRecord> {
    const columnLabels = await this.fileMakerService.getAllRecords(
      tenantId,
      'columnas_prefs',
    );

    if (!columnLabels.response.data?.length) {
      this.logger.error(`No column labels found for tenant ${tenantId}`);
      throw new NotFoundException('No column labels found');
    }

    const fieldData = columnLabels.response.data[0].fieldData;

    return {
      clienteClasificacion1: fieldData[
        fieldMap.data.prefCliente.classify1
      ] as string,
      clienteClasificacion2: fieldData[
        fieldMap.data.prefCliente.classify2
      ] as string,
      clienteClasificacion3: fieldData[
        fieldMap.data.prefCliente.classify3
      ] as string,
      clienteClasificacion4: fieldData[
        fieldMap.data.prefCliente.classify4
      ] as string,
      invClasificacion1: fieldData[fieldMap.data.prefInv.classify1] as string,
      invClasificacion2: fieldData[fieldMap.data.prefInv.classify2] as string,
      invClasificacion3: fieldData[fieldMap.data.prefInv.classify3] as string,
      invClasificacion4: fieldData[fieldMap.data.prefInv.classify4] as string,
    };
  }
}
