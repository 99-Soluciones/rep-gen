/**
 * Nombres de campo del layout apiExport_CompraITM (tabla base poITM_|).
 * Ficha: docs/reports/fichas/purchase-items/purchase-items.md
 */
export const LAYOUT = 'apiExport_CompraITM';

/** Compra (poFactura). */
const F = 'poItm_|poFACTURA_|_x_facturaIDU::';
export const COMPRA = {
  fechaAprobado: `${F}area_fechaEnPagos`,
  id: 'poItm_|PO_|_x_po::__id_po',
  repDeCompra: 'poItm_|USER_|_x_facturaIDU::userData_nombre_Completo',
  uuid: `${F}cfdi_UUID`,
  fechaCfdi: `${F}cfdi_fecha`,
  folio: `${F}cfdi_folio`,
  serie: `${F}cfdi_serie_v0_15_1`,
  granTotalMxn: `${F}monto_MXN_GranTotal`,
  observaciones: `${F}factura_observaciones_v0_18_1`,
  area: `${F}area_is_Cotizacion_noAprobado_Pagos_Cerrado`,
  saldoMxn: `${F}saldo_MXN_pendiente_GranTotal_saldoGeneral`,
  fechaLimiteDePago: `${F}saldo_fecha_pagoLimite`,
  moneda: `${F}_idu_moneda|v0_18_1`,
  tipoCambio: `${F}tc_tipoCambioValor_v0_18_1`,
} as const;

const P = 'poItm_|PROV_|_x_facturaIDU::';
export const PROVEEDOR = {
  nombre: `${P}local_NombreComercial`,
  razonSocial: `${P}fiscal_RazonSocial`,
  rfc: `${P}fiscal_RFC`,
  cuentaContable: `${P}cuentaContable_Temp_v0_20_2r`,
} as const;

const K = 'poItm_|contBANCO_|_x_facturaIDU::';
export const BANCO = {
  nombre: `${K}datos_nombre`,
  cuenta: `${K}datos_cuentaNumero`,
} as const;

/** Artículo de inventario del concepto. */
const I = 'poItm_|inv.ITM_|_x_invItmID::';
export const ARTICULO = {
  sku: `${I}itm_SKU`,
  marca: `${I}itm_Marca`,
  nombre: `${I}itm_Name`,
  nombreCompleto: `${I}itm_Name_Display`,
  cuentaContable: `${I}cuentaContable_ingresoOrInventario_v0_27_1`,
  categorias: [1, 2, 3, 4].map(
    (n) => `poItm_|inv.ITM.classify${n}_|_x_invItmID::name_v0_20_0`,
  ),
  // La unidad de uso, no la de contenido (ficha, columna 28).
  unidadClave: `${I}_idu_satUnitUso`,
  unidadNombre: 'poItm_|sat.UNITventa_|_x_invItmID::unitNombre',
} as const;

/** Concepto (poITM). Los montos son unitarios, en MXN. */
export const CONCEPTO = {
  tipo: 'is_stock_incrementable_gasto_costo',
  cantidad: 'qty_Ordered',
  unitSinDescuento: 'unit_MXN_importe_SINdescuento',
  unitConDescuento: 'unit_MXN_importe_CONdescuento',
  unitIva: 'unit_MXN_impuesto_trasladoIVA',
  unitIeps: 'unit_MXN_impuesto_trasladoIEPS',
  unitIvaRetenido: 'unit_MXN_impuesto_retenidoIVA_v0_18_1',
  unitIsrRetenido: 'unit_MXN_impuesto_retenidoISR_v0_18_1',
  unitGranTotal: 'unit_MXN_GranTotal',
  fechaEntrega: 'recibir_fecha',
  bodega: 'poItm_|BODEGA_|_x_facturaIDU::bodega_nombre',
} as const;
