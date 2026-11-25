import { Controller, Request, Post, Body, HttpCode } from '@nestjs/common';
import {
  GetBankComplementsReportUseCase,
  GetBankReportUseCase,
  GetCashInflowsReportUseCase,
  GetPayablesReportUseCase,
  GetPurchaseItemsReportUseCase,
  GetPurchasesReportUseCase,
  GetReceivablesReportUseCase,
  GetSalesReportUseCase,
  GetSalesitemReportUseCase,
} from '../application';
import type { ReportResponse } from '../application';
import type {
  PayablesResponse,
  ReportPayablesRecord,
  ReportPayablesSupplierRecord,
  ReceivablesResponse,
  ReportBankComplementRecord,
  ReportBankRecord,
  ReportCashInflowRecord,
  ReportPurchaseItemRecord,
  ReportPurchaseRecord,
  ReportReceivablesClientRecord,
  ReportReceivablesRecord,
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
    private readonly reportServiceCashInflows: GetCashInflowsReportUseCase,
    private readonly reportServiceBankComplements: GetBankComplementsReportUseCase,
    private readonly reportServicePurchaseItems: GetPurchaseItemsReportUseCase,
    private readonly reportServicePurchases: GetPurchasesReportUseCase,
    private readonly reportServicePayables: GetPayablesReportUseCase,
  ) {}

  /** Compras aprobadas en el rango, un renglón por compra. */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('compras/buscar')
  @HttpCode(200)
  async getPurchasesReport(
    @Body() { dateRange, refresh }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportPurchaseRecord>> {
    return this.reportServicePurchases.fetchReport(
      dateRange,
      req.tenant,
      req.id,
      refresh,
    );
  }

  /** Compras aprobadas en el rango, un renglón por concepto. */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('compras-conceptos/buscar')
  @HttpCode(200)
  async getPurchaseItemsReport(
    @Body() { dateRange, refresh }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportPurchaseItemRecord>> {
    return this.reportServicePurchaseItems.fetchReport(
      dateRange,
      req.tenant,
      req.id,
      refresh,
    );
  }

  /** Bancos con un renglón por complemento (movimiento × conciliación × complemento). */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('bancos-complementos/buscar')
  @HttpCode(200)
  async getBankComplementsReport(
    @Body() { dateRange, refresh }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportBankComplementRecord>> {
    return this.reportServiceBankComplements.fetchReport(
      dateRange,
      req.tenant,
      req.id,
      refresh,
    );
  }

  /** Foto al día de corte (no un rango): saldos al cierre de ese día. */
  @Post('cuentas-por-cobrar/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getReceivablesReport(
    @Body() { fechaCorte, refresh }: SearchCorteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReceivablesResponse<ReportReceivablesRecord>> {
    return this.reportServiceReceivables.fetchReport(
      fechaCorte,
      req.tenant,
      req.id,
      refresh,
    );
  }

  /** Cuentas por pagar al día de corte: compras y movimientos de banco con saldo. */
  @Post('cuentas-por-pagar/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getPayablesReport(
    @Body() { fechaCorte, refresh }: SearchCorteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PayablesResponse<ReportPayablesRecord>> {
    return this.reportServicePayables.fetchReport(
      fechaCorte,
      req.tenant,
      req.id,
      refresh,
    );
  }

  /** Cuentas por pagar por proveedor: el detalle sumado por proveedor. */
  @Post('cuentas-por-pagar-por-proveedor/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getPayablesSupplierReport(
    @Body() { fechaCorte, refresh }: SearchCorteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PayablesResponse<ReportPayablesSupplierRecord>> {
    return this.reportServicePayables.fetchSupplierReport(
      fechaCorte,
      req.tenant,
      req.id,
      refresh,
    );
  }

  /** Cuentas por cobrar por cliente: el detalle sumado por cliente. */
  @Post('cuentas-por-cobrar-por-cliente/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getReceivablesClientReport(
    @Body() { fechaCorte, refresh }: SearchCorteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReceivablesResponse<ReportReceivablesClientRecord>> {
    return this.reportServiceReceivables.fetchClientReport(
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

  /** Ingresos por pago × factura. */
  @Post('flujo-efectivo-ingresos/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getCashInflowsReport(
    @Body() { dateRange, refresh }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportCashInflowRecord>> {
    return this.reportServiceCashInflows.fetchReport(
      dateRange,
      'factura',
      req.tenant,
      req.id,
      refresh,
    );
  }

  /** Los mismos ingresos por pago × factura × concepto. */
  @Post('flujo-efectivo-ingresos-por-concepto/buscar')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getCashInflowsItemReport(
    @Body() { dateRange, refresh }: SearchReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponse<ReportCashInflowRecord>> {
    return this.reportServiceCashInflows.fetchReport(
      dateRange,
      'concepto',
      req.tenant,
      req.id,
      refresh,
    );
  }
}
