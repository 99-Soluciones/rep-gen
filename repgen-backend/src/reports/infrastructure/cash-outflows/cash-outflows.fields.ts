/**
 * Nombres de campo de los layouts apiExport_Egresos_Pagos y
 * apiExport_Egresos_Bancos.
 * Ficha: docs/reports/fichas/cash-outflows/cash-outflows.md
 */
export const LAYOUT_PAGOS = 'apiExport_Egresos_Pagos';
export const LAYOUT_BANCOS = 'apiExport_Egresos_Bancos';

const F = 'poFactura_|';
const PROV = `${F}PROV_|_x_provID::`;

/** Campos de la factura de compra (tabla base de apiExport_Egresos_Pagos). */
export const FAC = {
  compraId: `${F}PO_|_x_po::__id_po`,
  proveedor: `${PROV}local_NombreComercial`,
  razonSocial: `${PROV}fiscal_RazonSocial`,
  rfc: `${PROV}fiscal_RFC`,
  cuentaContable: `${PROV}cuentaContable_Temp_v0_20_2r`,
  uuid: 'cfdi_UUID',
  serie: 'cfdi_serie_v0_15_1',
  folio: 'cfdi_folio',
  fechaCfdi: 'cfdi_fecha',
  observaciones: 'factura_observaciones_v0_18_1',
  area: 'area_is_Cotizacion_noAprobado_Pagos_Cerrado',
  fechaLimiteDePago: 'saldo_fecha_pagoLimite',
  saldoMxn: 'saldo_MXN_pendiente_GranTotal_saldoGeneral',
  repDeCompra: `${F}USER.repComp_|_x_repCompID::userData_nombre_Completo`,
  importeConDescuento: 'monto_MXN_Importe_ConDescuento',
  iva: 'monto_MXN_tax_favorIVA',
  ieps: 'monto_MXN_tax_favorIEPSenFactura',
  ivaRetenido: 'monto_MXN_tax_contraIVAretenido_v0_18_1',
  isrRetenido: 'monto_MXN_tax_contraISRretenido_v0_18_1',
  granTotal: 'monto_MXN_GranTotal',
  bodega: `${F}BODEGA_|_x_bodegaReceptorID::bodega_nombre`,
  moneda: '_idu_moneda|v0_18_1',
  tipoCambio: 'tc_tipoCambioValor_v0_18_1',
} as const;

const BANCO_ITM = `${F}contBancoITM__|_x_id_egreso::`;
const BANCO = `${F}contBanco__|_x_id_bancoITM::`;

/** Portal de pagos de la factura; cada renglón trae su propio movimiento de banco. */
export const PAGOS_COMPRA = {
  portal: 'PagosCompra',
  montoMxn: `${F}cont.EGRESO_ITM|_x_facturaIDU::app_MXN_GranTotal`,
  /** Fecha del movimiento de banco: el día que salió el dinero. */
  fecha: `${BANCO_ITM}_fecha`,
  bancoFolio: `${BANCO_ITM}__id_bancoITM`,
  bancoTipoCambio: `${BANCO_ITM}tc_tipoCambioValor_v0_26_1`,
  formaPago: `${BANCO_ITM}_idu_formaPago_v0_22_1`,
  /** Vacío: compensación sin banco (forma de pago 17), no salió dinero. */
  bancoNombre: `${BANCO}datos_nombre`,
  bancoMoneda: `${BANCO}_idu_moneda`,
} as const;

const ITM = `${F}po.ITM|_x_facturaIDU::`;
const INV = `${F}inv.ITM_|_x_facturaIDU::`;

/** Portal de conceptos de la factura. */
export const CONCEPTOS = {
  portal: 'Conceptos',
  cantidad: `${ITM}qty_Ordered`,
  fechaEntrega: `${ITM}recibir_fecha`,
  tipo: `${ITM}is_stock_incrementable_gasto_costo`,
  precioUnitario: `${ITM}unit_MXN_importe_SINdescuento`,
  importeSinDescuento: `${ITM}sub.MXN.importe.SINdescuento`,
  descuento: `${ITM}sub.MXN.importe.Descuento`,
  importeConDescuento: `${ITM}sub.MXN.importe.CONdescuento`,
  iva: `${ITM}sub.MXN.impuesto.trasladoIVA`,
  ieps: `${ITM}sub.MXN.impuesto.trasladoIEPS`,
  ivaRetenido: `${ITM}sub.MXN.impuesto.retenidoIVA|v0.18.1`,
  isrRetenido: `${ITM}sub.MXN.impuesto.retenidoISR|v0.18.1`,
  granTotal: `${ITM}sub.MXN.GranTotal`,
  sku: `${INV}itm_SKU`,
  marca: `${INV}itm_Marca`,
  nombre: `${INV}itm_Name`,
  nombreCompleto: `${INV}itm_Name_Display`,
  cuentaContable: `${INV}cuentaContable_ingresoOrInventario_v0_27_1`,
  unidadClave: `${INV}_idu_satUnitUso`,
  unidadNombre: `${F}sat.UNIT|_x_facturaIDU::unitNombre`,
  categoria: (n: number) =>
    `${F}invITM_classify${n}_|_x_idu_classify${n}::name_v0_20_0`,
} as const;

const B = 'contBanco.ITM|';
const PROV_EGRESO = `${B}PROV.egreso|_x_bancoItmID::`;

/** Campos del movimiento de banco (tabla base de apiExport_Egresos_Bancos). */
export const BAN = {
  folio: '__id_bancoITM',
  fecha: '_fecha',
  cargo: 'monto_ORIG_cargo_v0_22_1',
  saldo: 'saldo_ORIG_porComplementar_v0_22_1',
  tipoCambio: 'tc_tipoCambioValor_v0_26_1',
  formaPago: '_idu_formaPago_v0_22_1',
  /** Texto del estado de cuenta: los traspasos empiezan con TRASPASO ENTRE CUENTAS. */
  concepto: 'mConceptoDeBancoTexto_v0_20_0',
  banco: `${B}contBANCO_|_x_bancoID::datos_nombre`,
  moneda: `${B}contBANCO_|_x_bancoID::_idu_moneda`,
  /** Proveedor del egreso; vacío o 0 = cargo no identificado. */
  proveedorEgreso: `${B}contEGRESO_|_x_bancoItmID::_concil_id_prov`,
  proveedor: `${PROV_EGRESO}local_NombreComercial`,
  razonSocial: `${PROV_EGRESO}fiscal_RazonSocial`,
  rfc: `${PROV_EGRESO}fiscal_RFC`,
  cuentaContable: `${PROV_EGRESO}cuentaContable_Temp_v0_20_2r`,
} as const;
