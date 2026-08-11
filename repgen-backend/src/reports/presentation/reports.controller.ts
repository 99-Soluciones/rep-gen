import {
  Controller,
  Query,
  Request,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import {
  GetBankReportUseCase,
  GetSalesReportUseCase,
  GetSalesitemReportUseCase,
} from '../application';
//import type { RequestUserReport } from '../interfaces/filemaker.interface';
import type { ReportBankRecord } from '../domain';
import type { ReportSalesRecord } from '../domain';
import type { ReportSalesItemRecord } from '../domain';
import type { AuthenticatedRequest } from '../../auth/guards/ijwt';

import { PaginatedResponse } from '../application';
import { Throttle } from '@nestjs/throttler/dist/throttler.decorator';
import { SearchBankReportDto } from './dto';
import { SearchSalesReportDto } from './dto';
import { SearchSalesItemReportDto } from './dto';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportServiceBanks: GetBankReportUseCase,
    private readonly reportServiceSales: GetSalesReportUseCase,
    private readonly reportServiceSalesItem: GetSalesitemReportUseCase,
  ) {}

  /**
   * Endpoint para obtener reportes de bancos con filtros aplicados.
   * Este endpoint recibe un modelo de filtros específico para el reporte de bancos, un valor de búsqueda global
   * y un rango de fechas.
   * @param globalSearch
   * @param filterModel
   * @param dateRange
   * @returns
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('bancos/buscar')
  @HttpCode(200)
  async getBankReports(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Body() body: SearchBankReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedResponse<ReportBankRecord>> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = limitNumber > 0 ? (pageNumber - 1) * limitNumber + 1 : 1;

    const globalSearch = body.globalSearch ?? '';
    const filterModel = body.filterModel ?? {};
    const dateRange = body.dateRange ?? { startDate: '', endDate: '' };

    for (const key in filterModel) {
      const filterKey = key as keyof typeof filterModel;
      if (filterKey === 'abono' || filterKey === 'cargo') {
        const item = filterModel[filterKey];
        if (item && item.filter === 0) {
          item.filter = '';
        }
      }
    }

    return this.reportServiceBanks.fetchFromFileMakerWithFilters(
      offset,
      limitNumber,
      globalSearch,
      filterModel,
      dateRange,
      req.tenant,
      req.id,
    );
  }

  @Post('ventas/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getSalesReports(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Body() body: SearchSalesReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedResponse<ReportSalesRecord>> {
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.max(0, parseInt(limit, 10));
    const offset = limitNumber > 0 ? (pageNumber - 1) * limitNumber + 1 : 1;

    const globalSearch = body.globalSearch ?? '';
    const filterModel = body.filterModel ?? {};
    const dateRange = body.dateRange ?? { startDate: '', endDate: '' };

    return this.reportServiceSales.fetchFromFileMakerWithFilters(
      offset,
      limitNumber,
      globalSearch,
      filterModel,
      dateRange,
      req.tenant,
      req.id,
    );
  }

  @Post('ventas-por-concepto/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getSalesItemReports(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Body() body: SearchSalesItemReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedResponse<ReportSalesItemRecord>> {
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.max(0, parseInt(limit, 10));
    const offset = limitNumber > 0 ? (pageNumber - 1) * limitNumber + 1 : 1;

    const globalSearch = body.globalSearch ?? '';
    const filterModel = body.filterModel ?? {};
    const dateRange = body.dateRange ?? { startDate: '', endDate: '' };

    return this.reportServiceSalesItem.fetchFromFileMakerWithFilters(
      offset,
      limitNumber,
      globalSearch,
      filterModel,
      dateRange,
      req.tenant,
      req.id,
    );
  }
}
