/**
 * Nombres de campo del layout apiExport_Compra (tabla base poFACTURA_).
 * Ficha: docs/reports/fichas/purchases/purchases.md
 */
export const LAYOUT = 'apiExport_Compra';

/** Compra (poFactura). */
export const COMPRA = {
  fechaAprobado: 'area_fechaEnPagos',
  id: 'poFactura_|PO_|_x_po::__id_po',
  repDeCompra:
    'poFactura_|USER.repComp_|_x_repCompID::userData_nombre_Completo',
  uuid: 'cfdi_UUID',
  fechaCfdi: 'cfdi_fecha',
  folio: 'cfdi_folio',
  serie: 'cfdi_serie_v0_15_1',
  observaciones: 'factura_observaciones_v0_18_1',
  area: 'area_is_Cotizacion_noAprobado_Pagos_Cerrado',
  saldoMxn: 'saldo_MXN_pendiente_GranTotal_saldoGeneral',
  fechaLimiteDePago: 'saldo_fecha_pagoLimite',
  moneda: '_idu_moneda|v0_18_1',
  tipoCambio: 'tc_tipoCambioValor_v0_18_1',
} as const;

/** Montos de la compra, en MXN. */
export const MONTOS = {
  importeConDescuento: 'monto_MXN_Importe_ConDescuento',
  iva: 'monto_MXN_tax_favorIVA',
  ieps: 'monto_MXN_tax_favorIEPSenFactura',
  ivaRetenido: 'monto_MXN_tax_contraIVAretenido_v0_18_1',
  isrRetenido: 'monto_MXN_tax_contraISRretenido_v0_18_1',
  granTotal: 'monto_MXN_GranTotal',
} as const;

const P = 'poFactura_|PROV_|_x_provID::';
export const PROVEEDOR = {
  nombre: `${P}local_NombreComercial`,
  razonSocial: `${P}fiscal_RazonSocial`,
  rfc: `${P}fiscal_RFC`,
  cuentaContable: `${P}cuentaContable_Temp_v0_20_2r`,
} as const;

const K = 'poFactura_|cont.BANCO_|_x_bancoID::';
export const BANCO = {
  nombre: `${K}datos_nombre`,
  cuenta: `${K}datos_cuentaNumero`,
} as const;

export const ENTREGA = {
  bodega: 'poFactura_|BODEGA_|_x_bodegaReceptorID::bodega_nombre',
  estatus: 'entrega_is_Entregado_Pendiente',
  fechaEstimada: 'entrega_fechaETAorig',
} as const;
