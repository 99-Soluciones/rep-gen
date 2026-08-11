import type { FilterModel } from '../reports.types';

/**
 * Interfaces para la salida del reporte de ventas
 * ReportSalesRecord representa el formato final de cada registro en el reporte, con campos opcionales que se llenarán según la disponibilidad de datos.
 * FilterSalesModel define la estructura de los filtros que se pueden aplicar al reporte, utilizando la estructura genérica de FilterModel para cada campo relevante.
 * ReportSalesItemRecord extiende ReportSalesRecord con campos adicionales específicos para el reporte de ventas por artículo.
 * FilterSalesItemModel extiende FilterSalesModel con campos adicionales para filtrar por criterios específicos de artículos en el reporte de ventas por artículo.
 */
export interface ReportSalesRecord {
  cliente: string;
  clienteRazonSocial: string;
  clienteRfc: string;
  clienteCuentaContable: string;
  clienteCalle: string;
  clienteColonia: string;
  clienteDelegacion: string;
  clienteCiudad: string;
  clienteEstado: string;
  clienteId: number;
  clienteRepDeVenta: string;
  clienteRepDeCobranza: string;
  nombreClasificacion1: string;
  nombreClasificacion2: string;
  nombreClasificacion3: string;
  nombreClasificacion4: string;
  clasificacion1: string;
  clasificacion2: string;
  clasificacion3: string;
  clasificacion4: string;

  ventaId: number;
  devoId: string;
  facturaUuid: string;
  facturaSerie: string;
  facturaFolio: string;
  facturaFecha: string;
  facturaGranTotalMxn: number;
  facturaGranTotalOriginal: number; // calculado por el importe gran total mxn / tipo de cambio, si la moneda es diferente a MXN, si la moneda es MXN es igual a facturaGranTotalMxn
  facturaFechaDeCaptura: string;
  facturaTipoDeCambio: number;
  facturaMoneda: string;
  facturaUsoCfdi: string;
  facturaMetodoPago: string;
  facturaFormaDePago: string;
  facturaEstatus: string;
  facturaSaldoActual: number;
  facturaTasaPagada: number;
  observacionesEnCfdi: string;
  bodegaId: number;
  bodegaNombre: string;
  importeSinDescuentoMxn: number;
  descuentoMontoMxn: number;
  importeConDescuentoMxn: number;
  ivaMxn: number;
  iepsMxn: number;
  ivaRetenidoMxn: number;
  isrRetenidoMxn: number;
  pagoGranTotalMxn: number;
}

export interface FilterSalesModel {
  cliente?: FilterModel;
  clienteRazonSocial?: FilterModel;
  clienteRfc?: FilterModel;
  clienteCuentaContable?: FilterModel;
  clienteCalle?: FilterModel;
  clienteColonia?: FilterModel;
  clienteDelegacion?: FilterModel;
  clienteCiudad?: FilterModel;
  clienteEstado?: FilterModel;
  clienteId?: FilterModel;
  clienteRepDeVenta?: FilterModel;
  clienteRepDeCobranza?: FilterModel;
  clasificacion1?: FilterModel;
  clasificacion2?: FilterModel;
  clasificacion3?: FilterModel;
  clasificacion4?: FilterModel;

  ventaId?: FilterModel;
  devoId?: FilterModel;
  facturaUuid?: FilterModel;
  facturaSerie?: FilterModel;
  facturaFolio?: FilterModel;
  facturaFecha?: FilterModel;
  facturaGranTotalMxn?: FilterModel;
  facturaGranTotalOriginal?: FilterModel; // calculado por el importe gran total mxn / tipo de cambio, si la moneda es diferente a MXN, si la moneda es MXN es igual a facturaGranTotalMxn
  facturaFechaDeCaptura?: FilterModel;
  facturaTipoDeCambio?: FilterModel;
  facturaMoneda?: FilterModel;
  facturaUsoCfdi?: FilterModel;
  facturaMetodoPago?: FilterModel;
  facturaFormaDePago?: FilterModel;
  facturaEstatus?: FilterModel;
  facturaSaldoActual?: FilterModel;
  facturaTasaPagada?: FilterModel;
  facturaRepDeVenta?: FilterModel;
  facturaRepDeCobranza?: FilterModel;
  observacionesEnCfdi?: FilterModel;
  bodegaId?: FilterModel;
  bodegaNombre?: FilterModel;
  importeSinDescuentoMxn?: FilterModel;
  descuentoMontoMxn?: FilterModel;
  importeConDescuentoMxn?: FilterModel;
  ivaMxn?: FilterModel;
  iepsMxn?: FilterModel;
  ivaRetenidoMxn?: FilterModel;
  isrRetenidoMxn?: FilterModel;
  pagoGranTotalMxn?: FilterModel;
}

/**
 * Interfaces para el mapeo de registros raw de ventas
 */
export interface SalesClienteMappedRecord {
  modId: string;
  recordId: string;
  idCliente: number;
  cuentaContable: string;
  nombreComercial: string;
  rfc: string;
  razonSocial: string;
  diasCreditoAutorizado: number;
  representanteCobranza: string;
  representanteVentas: string;
  clasificacion1: string;
  clasificacion2: string;
  clasificacion3: string;
  clasificacion4: string;
  categoria1: string;
  categoria2: string;
  categoria3: string;
  categoria4: string;
}

export interface SalesDevolucionMappedRecord {
  modId: string;
  recordId: string;
  idMoneda: string;
  tipoCambio: number;
  serieFolioNotaCreditoCargo: string;
  uuidNotaCredito: string;
  idDevolucion: number;
  fechaCaptura: string;
  fechaTimbreCfdi: string;
  montoContraIeps: number;
  montoContraIva: number;
  montoFavorIvaRetenido: number;
  montoFavorIsrRetenido: number;
  montoGranTotal: number;
  montoImporte: number;
  representanteCobranza: string;
  representanteVentas: string;
}

export interface SalesMappedRecord {
  idVenta: number;
  idBodega: number;
  idFormaPagoCfdi: string;
  idMetodoPagoCfdi: string;
  idUsoCfdi: string;
  idMoneda: string;
  fechaVenta: string;
  fechaTimbradoFactura: string;
  folioFactura: number;
  observacionesCfdi: string;
  uuidCfdi: string;
  serieFolioCfdi: string;
  fechaCancelacionCfdi: string;
  direccionEntrega: string;
  ciudadEntrega: string;
  coloniaEntrega: string;
  delegacionEntrega: string;
  estadoEntrega: string;
  montoGranTotal: number;
  montoImporteSinDescuentoSinIeps: number;
  montoContraIeps: number;
  montoContraIva: number;
  montoFavorIvaRetenido: number;
  montoFavorIsrRetenido: number;
  saldoPagadoEnAnticipos: number;
  saldoPagadoEnPagos: number;
  saldoPendienteGranTotal: number;
  tasaDescuento: number;
  tipoCambio: number;
  nombreBodega: string;
  cliente: SalesClienteMappedRecord;
  devolucion: SalesDevolucionMappedRecord;
}
