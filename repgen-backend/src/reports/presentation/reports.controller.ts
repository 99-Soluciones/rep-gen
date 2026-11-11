import { Controller, Request, Post, Body, HttpCode } from '@nestjs/common';
import {
  GetBankReportUseCase,
  GetReceivablesReportUseCase,
  GetSalesReportUseCase,
  GetSalesitemReportUseCase,
} from '../application';
import type { ReportResponse } from '../application';
import type {
  ReceivablesResponse,
  ReportBankRecord,
  ReportSalesRecord,
  ReportSalesItemRecord,
} from '../domain';
import type { AuthenticatedRequest } from '../../auth/guards/ijwt';
import { Throttle } from '@nestjs/throttler/dist/throttler.decorator';
import { SearchCorteDto, SearchReportDto } from './dto';

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
    private readonly reportServiceReceivables: GetReceivablesReportUseCase,
  ) {}

  /** Foto al día de corte (no un rango): saldos al cierre de ese día. */
  @Post('cuentas-por-cobrar/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getReceivablesReport(
    @Body() { fechaCorte, refresh }: SearchCorteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReceivablesResponse> {
    return this.reportServiceReceivables.fetchReport(
      fechaCorte,
      req.tenant,
      req.id,
      refresh,
    );
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('bancos/buscar')
  @HttpCode(200)
  async getBankReports(
    @Body() { dateRange, refresh }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportBankRecord>> {
    return this.reportServiceBanks.fetchReport(
      dateRange,
      req.tenant,
      req.id,
      refresh,
    );
  }

  @Post('ventas/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getSalesReports(
    @Body() { dateRange, refresh }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportSalesRecord>> {
    return this.reportServiceSales.fetchReport(
      dateRange,
      req.tenant,
      req.id,
      refresh,
    );
  }

  @Post('ventas-por-concepto/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getSalesItemReports(
    @Body() { dateRange, refresh }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportSalesItemRecord>> {
    return this.reportServiceSalesItem.fetchReport(
      dateRange,
      req.tenant,
      req.id,
      refresh,
    );
  }
}
