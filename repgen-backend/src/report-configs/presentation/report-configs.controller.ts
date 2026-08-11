import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/guards/ijwt';
import { GetReportConfigsUseCase } from '../application/get-report-configs.use-case';
import { CreateReportConfigUseCase } from '../application/create-report-config.use-case';
import { UpdateReportConfigUseCase } from '../application/update-report-config.use-case';
import { DeleteReportConfigUseCase } from '../application/delete-report-config.use-case';
import { CreateReportConfigDto } from './dto/create-report-config.dto';
import { UpdateReportConfigDto } from './dto/update-report-config.dto';
import type { ReportConfigResponse } from '../domain/report-config.types';
import type { ColumnStateEntry } from '../domain/report-config.types';

@Controller('report-configs')
export class ReportConfigsController {
  constructor(
    private readonly getConfigs: GetReportConfigsUseCase,
    private readonly createConfig: CreateReportConfigUseCase,
    private readonly updateConfig: UpdateReportConfigUseCase,
    private readonly deleteConfig: DeleteReportConfigUseCase,
  ) {}

  @Get()
  @HttpCode(200)
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('reportId') reportId: string,
  ): Promise<ReportConfigResponse[]> {
    return this.getConfigs.execute(req.tenant, req.id, reportId);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateReportConfigDto,
  ): Promise<ReportConfigResponse> {
    return this.createConfig.execute(
      req.tenant,
      req.id,
      dto.reportId,
      dto.name,
      dto.columnState as ColumnStateEntry[],
      dto.isDefault ?? false,
    );
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateReportConfigDto,
  ): Promise<ReportConfigResponse> {
    return this.updateConfig.execute(req.tenant, req.id, id, {
      name: dto.name,
      columnState: dto.columnState as ColumnStateEntry[] | undefined,
      isDefault: dto.isDefault,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    return this.deleteConfig.execute(req.tenant, req.id, id);
  }
}
