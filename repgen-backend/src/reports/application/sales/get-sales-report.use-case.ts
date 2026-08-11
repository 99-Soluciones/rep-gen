import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { FileMakerService } from '../../../filemaker/filemaker.service';
import { cleanData, salesFieldMapJson } from '../../infrastructure/sales';
import { BaseReportService } from '../shared/base-report.service';
import { FilterSalesModel, ReportSalesRecord } from '../../domain/sales';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';
@Injectable()
export class GetSalesReportUseCase extends BaseReportService<
  FilterSalesModel,
  ReportSalesRecord,
  GetBankPermissionsUseCase
> {
  constructor(
    fmService: FileMakerService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: LoggerService,
  ) {
    const data = salesFieldMapJson.data;
    super(
      fmService,
      cacheManager,
      null,
      {
        layoutName: 'apiExport_Venta',
        cachePrefix: 'ventas_',
        dateField: [
          data.fechaTimbradoFactura,
          data.fechaCancelacionCfdi,
          data.devolucion.fechaTimbreCfdi,
        ],
        permissionFieldName: [],
        fieldMapping: {
          cliente: [data.cliente.nombreComercial],
          clienteRazonSocial: data.cliente.razonSocial,
          clienteRfc: data.cliente.rfc,
          clienteCuentaContable: data.cliente.cuentaContable,
          clienteCalle: data.direccionEntrega,
          clienteColonia: data.coloniaEntrega,
          clienteDelegacion: data.delegacionEntrega,
          clienteCiudad: data.ciudadEntrega,
          clienteEstado: data.estadoEntrega,
          clienteId: data.cliente.idCliente,
          clienteRepDeVenta: data.cliente.representanteVentas,
          clienteRepDeCobranza: data.cliente.representanteCobranza,
          clasificacion1: data.cliente.clasificacion1,
          clasificacion2: data.cliente.clasificacion2,
          clasificacion3: data.cliente.clasificacion3,
          clasificacion4: data.cliente.clasificacion4,
          ventaId: data.idVenta,
          devoId: data.devolucion.idDevolucion,
          facturaUuid: [data.uuidCfdi, data.devolucion.uuidNotaCredito],
          facturaSerie: [
            data.serieFolioCfdi,
            data.devolucion.serieFolioNotaCreditoCargo,
          ],
          facturaFolio: [
            data.folioFactura,
            data.devolucion.serieFolioNotaCreditoCargo,
          ],
          facturaFecha: '',
          facturaGranTotalMxn: [
            data.montoGranTotal,
            data.devolucion.montoGranTotal,
          ],
          facturaGranTotalOriginal: [
            data.montoGranTotal,
            data.devolucion.montoGranTotal,
          ],
          facturaFechaDeCaptura: data.fechaVenta,
          facturaTipoDeCambio: data.tipoCambio,
          facturaMoneda: data.idMoneda,
          facturaUsoCfdi: data.idUsoCfdi,
          facturaMetodoPago: data.idMetodoPagoCfdi,
          facturaFormaDePago: data.idFormaPagoCfdi,
          facturaEstatus: '',
          facturaSaldoActual: data.saldoPendienteGranTotal,
          facturaTasaPagada: '',
          observacionesEnCfdi: data.observacionesCfdi,
          bodegaId: data.idBodega,
          bodegaNombre: data.nombreBodega,
          importeSinDescuentoMxn: [
            data.montoImporteSinDescuentoSinIeps,
            data.devolucion.montoImporte,
          ],
          descuentoMontoMxn: [data.tasaDescuento],
          importeConDescuentoMxn: [
            data.montoGranTotal,
            data.devolucion.montoGranTotal,
          ],
          ivaMxn: [data.montoContraIva, data.devolucion.montoContraIva],
          iepsMxn: [data.montoContraIeps, data.devolucion.montoContraIeps],
          ivaRetenidoMxn: [
            data.montoFavorIvaRetenido,
            data.devolucion.montoFavorIvaRetenido,
          ],
          isrRetenidoMxn: [
            data.montoFavorIsrRetenido,
            data.devolucion.montoFavorIsrRetenido,
          ],
          pagoGranTotalMxn: [
            data.saldoPagadoEnPagos,
            data.saldoPagadoEnAnticipos,
          ],
        },
        globalSearchFields: [
          data.cliente.nombreComercial,
          data.cliente.razonSocial,
          data.cliente.rfc,
          data.cliente.representanteCobranza,
          data.cliente.representanteVentas,
          data.cliente.clasificacion1,
          data.cliente.clasificacion2,
          data.cliente.clasificacion3,
          data.cliente.clasificacion4,
          data.ciudadEntrega,
          data.estadoEntrega,
          data.direccionEntrega,
          data.delegacionEntrega,
          data.cliente.cuentaContable,
          data.nombreBodega,
          data.folioFactura,
          data.uuidCfdi,
          data.serieFolioCfdi,
          data.observacionesCfdi,
          data.idMoneda,
        ],
        cleanDataFunction: cleanData,
      },
      logger,
    );
  }
}
