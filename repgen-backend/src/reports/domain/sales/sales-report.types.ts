// Contrato de la API, compartido con el frontend.
export type { ReportSalesRecord } from '@repgen/shared-types';

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
