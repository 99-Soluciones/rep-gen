import { Controller, Request, Post, Body, HttpCode } from '@nestjs/common';
import {
  GetBankReportUseCase,
  GetSalesReportUseCase,
  GetSalesitemReportUseCase,
} from '../application';
import type { ReportResponse } from '../application';
import type {
  ReportBankRecord,
  ReportSalesRecord,
  ReportSalesItemRecord,
} from '../domain';
import type { AuthenticatedRequest } from '../../auth/guards/ijwt';
import { Throttle } from '@nestjs/throttler/dist/throttler.decorator';
import { SearchReportDto } from './dto';

/**
 * Cada endpoint devuelve todos los registros del rango de fechas que el
 * usuario puede ver; el filtrado y la paginación son del lado del cliente.
 */
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportServiceBanks: GetBankReportUseCase,
    private readonly reportServiceSales: GetSalesReportUseCase,
    private readonly reportServiceSalesItem: GetSalesitemReportUseCase,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('bancos/buscar')
  @HttpCode(200)
  async getBankReports(
    @Body() { dateRange }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportBankRecord>> {
    return this.reportServiceBanks.fetchReport(dateRange, req.tenant, req.id);
  }

  @Post('ventas/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getSalesReports(
    @Body() { dateRange }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportSalesRecord>> {
    return this.reportServiceSales.fetchReport(dateRange, req.tenant, req.id);
  }

  @Post('ventas-por-concepto/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getSalesItemReports(
    @Body() { dateRange }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportSalesItemRecord>> {
    return this.reportServiceSalesItem.fetchReport(
      dateRange,
      req.tenant,
      req.id,
    );
  }
}
