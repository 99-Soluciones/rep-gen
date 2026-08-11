import { Controller, Get, HttpCode, Request } from '@nestjs/common';
import { TenantService } from '../tenant.service';
import type { ColumnLabelsResponse } from '../domain/column-labels';
import type { TenantFeaturesResponse } from '../domain/tenant-features';
import type { AuthenticatedRequest } from '../../auth/guards/ijwt';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('column-labels')
  @HttpCode(200)
  async getColumnLabels(
    @Request() req: AuthenticatedRequest,
  ): Promise<ColumnLabelsResponse> {
    return this.tenantService.getColumnLabels(req.tenant);
  }

  @Get('features')
  @HttpCode(200)
  async getFeatures(
    @Request() req: AuthenticatedRequest,
  ): Promise<TenantFeaturesResponse> {
    return this.tenantService.getFeatures(req.tenant);
  }
}
