import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type {
  FilterSalesItemModel,
  ReportSalesItemRecord,
} from '../../domain/salesitem';
import type { FilterModel } from '../../domain';

import { BaseReportService } from '../shared/base-report.service';
import { FileMakerService } from '../../../filemaker/filemaker.service';

import {
  cleanData,
  salesitemFieldMapJson,
} from '../../infrastructure/salesitem';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';

@Injectable()
export class GetSalesitemReportUseCase extends BaseReportService<
  FilterSalesItemModel,
  ReportSalesItemRecord,
  GetBankPermissionsUseCase
> {
  constructor(
    fmService: FileMakerService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: LoggerService,
  ) {
    const data = salesitemFieldMapJson.data;

    const matchesTextFilter = (
      recordValue: unknown,
      filter: FilterModel,
    ): boolean => {
      const toLowerPrimitiveString = (value: unknown): string => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          return String(value).toLowerCase();
        }
        return '';
      };

      const raw = toLowerPrimitiveString(recordValue);
      const needle = toLowerPrimitiveString(filter.filter);

      if (filter.type === 'empty') {
        return raw.trim() === '';
      }

      if (filter.type === 'equals') {
        return raw === needle;
      }
      return needle === '' ? true : raw.includes(needle);
    };

    super(
      fmService,
      cacheManager,
      null,
      {
        layoutName: 'apiExport_VentaITM',
        cachePrefix: 'ventaITM',
        dateField: [
          data.venta.fechaTimbrado,
          data.venta.fechaCancelacion,
          data.devolucion.fechaTimbrado,
        ],
        permissionFieldName: [],
        fieldMapping: {
          cliente: data.cliente.nombreComercial,
          clienteRazonSocial: data.cliente.razonSocial,
          clienteRfc: data.cliente.rfc,
          clienteCuentaContable: data.cliente.cuentaContable,
          clienteCalle: data.entrega.direccion,
          clienteColonia: data.entrega.colonia,
          clienteDelegacion: data.entrega.delegacion,
          clienteCiudad: data.entrega.ciudad,
          clienteEstado: data.entrega.estado,
          clienteId: data.cliente.id,
          clienteRepDeVenta: data.venta.repVenta,
          clienteRepDeCobranza: data.usuario.idCobranza,
          clasificacion1: data.cliente.clasificacion1,
          clasificacion2: data.cliente.clasificacion2,
          clasificacion3: data.cliente.clasificacion3,
          clasificacion4: data.cliente.clasificacion4,
          ventaId: data.venta.id,
          devoId: data.devolucion.id,
          facturaUuid: [data.venta.uuid, data.devolucion.notaUuid],
          facturaSerie: [data.venta.serieFolio, data.devolucion.notaSerieFolio],
          facturaFolio: [data.venta.folio, data.devolucion.notaSerieFolio],
          facturaFecha: '',
          facturaGranTotalMxn: [
            data.montos.granTotal,
            data.devolucion.granTotal,
          ],
          facturaGranTotalOriginal: [
            data.montos.granTotal,
            data.devolucion.granTotal,
          ],
          facturaFechaDeCaptura: data.venta.fechaCotizacion,
          facturaTipoDeCambio: data.venta.tipoCambio,
          facturaMoneda: data.venta.moneda,
          facturaUsoCfdi: data.venta.usoCDFI,
          facturaMetodoPago: data.venta.metodoPago,
          facturaFormaDePago: data.venta.formaPago,
          facturaSaldoActual: [data.montos.pendienteGranTotal],
          observacionesEnCfdi: data.venta.observaciones,
          bodegaId: data.venta.bodegaId,
          bodegaNombre: data.bodega.nombre,
          importeSinDescuentoMxn: [
            data.montos.sinDescuentoSinIEPS,
            data.devolucion.importe,
          ],
          descuentoMontoMxn: [data.montos.descuento],
          importeConDescuentoMxn: [
            data.montos.granTotal,
            data.devolucion.granTotal,
          ],
          ivaMxn: [data.montos.contraIVA, data.devolucion.contraIVA],
          iepsMxn: [data.montos.contraIEPS, data.devolucion.contraIEPS],
          ivaRetenidoMxn: [
            data.montos.favorIVAretenido,
            data.devolucion.favorIVAretenido,
          ],
          isrRetenidoMxn: [
            data.montos.favorISRretenido,
            data.devolucion.favorISRretenido,
          ],
          pagoGranTotalMxn: [data.montos.pagadoPagos],
          tipoDeConcepto: data.item.tipo,
          costoDirectoUnitarioMxn: [data.sub.margenCosto],
          costoDirectoSubTotalMxn: [data.sub.margenCosto],
          articuloSku: data.item.sku,
          articuloMarca: data.item.marca,
          articuloNombre: data.item.nombre,
          articuloNombreCompleto: data.item.nombreDisplay,
          articuloCuentaContable: data.item.cuentaContable,
          categoriadeProducto1: data.item.clasificacion1,
          categoriadeProducto2: data.item.clasificacion2,
          categoriadeProducto3: data.item.clasificacion3,
          categoriadeProducto4: data.item.clasificacion4,
          claveDeProductoOServicio: data.item.satClavePS,
          cantidad: [data.qty, data.devolucion.item.qty],
          unidadDeVenta: data.item.satUnitVenta,
          unidadDeContenido: data.item.satUnitCont,
          contenidoUnitario: data.item.contenidoCantidad,
          contenidoSubTotal: '',
          precioUnitario: [data.unit.granTotal],
          articuloImporteSinDescuentoMxn: [
            data.unit.sinDescuentoSinIEPS,
            data.devolucion.item.importe,
          ],
          articuloDescuentoMontoMxn: [data.unit.descuento],
          articuloImporteConDescuentoMxn: [
            data.unit.granTotal,
            data.devolucion.item.granTotal,
          ],
          articuloIVAMxn: [data.unit.contraIVA, data.devolucion.item.contraIVA],
          articuloIEPSMxn: [
            data.unit.contraIEPS,
            data.devolucion.item.contraIEPS,
          ],
          articuloIVARetenidoMxn: [
            data.unit.favorIVAretenido,
            data.devolucion.item.ivaRet,
          ],
          articuloISRretenidoMxn: [
            data.unit.favorISRretenido,
            data.devolucion.item.isrRet,
          ],
        },
        globalSearchFields: [
          data.bodega.nombre,
          data.cliente.nombreComercial,
          data.cliente.razonSocial,
          data.cliente.rfc,
          data.item.sku,
          data.item.nombre,
          data.item.nombreDisplay,
          data.venta.uuid,
          data.venta.serieFolio,
          data.venta.folio,
          data.item.tipo,
        ],
        cleanDataFunction: cleanData,
        postFilterFunction: (records, filterModel) => {
          const methodFilter = filterModel.metodoDeAdquisicion;
          if (!methodFilter) return records;

          if (methodFilter.filterType !== 'text') return records;

          return records.filter((record) =>
            matchesTextFilter(record.metodoDeAdquisicion, methodFilter),
          );
        },
      },
      logger,
    );
  }
}
