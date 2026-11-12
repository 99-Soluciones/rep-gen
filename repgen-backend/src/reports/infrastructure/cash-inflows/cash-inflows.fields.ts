/**
 * Nombres de campo de los layouts apiExport_Ingresos_Pagos y
 * apiExport_Ingresos_Bancos.
 * Ficha: docs/reports/fichas/cash-inflows/cash-inflows.md
 */
export const LAYOUT_PAGOS = 'apiExport_Ingresos_Pagos';
export const LAYOUT_BANCOS = 'apiExport_Ingresos_Bancos';

const V = 'venta_|';
const CLIENTE = `${V}CLIENTE_|_x_clienteID::`;

/** Campos de la venta (tabla base de apiExport_Ingresos_Pagos). */
export const VEN = {
  clienteId: `${CLIENTE}___id_cliente`,
  cliente: `${CLIENTE}destLocal_dirNombreComercial`,
  razonSocial: `${CLIENTE}fiscal_RazonSocial`,
  rfc: `${CLIENTE}fiscal_RFC`,
  cuentaContable: `${CLIENTE}cuentaContableTemp_v0_20_2r`,
  creditoAutorizado: `${CLIENTE}credito.monto.Autorized`,
  repCliente: `${V}USER.repVent_|_x_clienteID::userData_nombre_Completo`,
  clasificacion: (n: number) => `${V}cliente.Classify${n}|_x_clienteID::name`,
  colonia: 'entrega_dest_Colonia',
  delegacion: 'entrega_dest_Delegacion',
  ciudad: 'entrega_dest_Ciudad',
  estado: 'entrega_dest_EDO',
  ventaId: '__id_venta',
  uuid: 'cfdi_UUID',
  serieFolio: 'cfdi_facturaSerieFolio_v0_18_1',
  timbrado: 'cfdi_FacturaFechaTimbrar',
  granTotal: 'monto_GranTotal',
  moneda: '_idu_tc_moneda_v0_16_0',
  tipoCambio: 'tc_tipoCambioValor_v0_25_3',
  usoCfdi: '_idu_cdfi_usoCDFI',
  metodoPago: '_idu_cdfi_metoPago',
  area: 'area__is_Cotizacion_Ventas_Facturacion_Almacen_Repartos_Cancelada',
  estatusSaldo: 'saldo_isPendiente_Cobrado_NoCobrar_Cancelado',
  saldo: 'saldo_Pendiente_GranTotal',
  repFactura: `${V}USER_|_x_repVent::userData_nombre_Completo`,
  repCobranza: `${V}USER.repCobranza_|_x_clienteID::userData_nombre_Completo`,
  observaciones: 'cfdi_Observaciones_v0_18_4',
  bodegaId: '_id_bodega',
  bodegaNombre: `${V}BODEGA_|_x_bodegaID::bodega_nombre`,
  importeSinDescuento: 'monto_Importe_sinDiscount_sinIEPS',
  descuento: 'monto_Importe_DiscountMonto',
  iva: 'monto_contraIVA',
  ieps: 'monto_contraIEPS',
  ivaRetenido: 'monto_favorIVAretenido_v0_18_1',
  isrRetenido: 'monto_favorISRretenido_v0_18_1',
} as const;

const PAGO = `${V}contIngreso.ITM|_x_ventaID::`;
const BANCO_ITM = `${V}contBanco.ITM|_x_ventaID::`;
const BANCO = `${V}contBANCO.pagoAplicada_|_x_ventaID::`;

/** Portal de pagos aplicados a la venta; cada renglón trae su movimiento de banco. */
export const PAGOS_VENTA = {
  portal: 'PagosVenta',
  montoMxn: `${PAGO}app_MXN_GranTotal`,
  /** Fecha del complemento; sin complemento trae la del ingreso. Nunca vacía. */
  fecha: `${PAGO}fecha_ingresoITM_fechaDelComplemento`,
  /** 0 o vacío: movimiento sin banco (nota de crédito). */
  bancoFolio: `${BANCO_ITM}__id_bancoITM`,
  formaPago: `${BANCO_ITM}_idu_formaPago_v0_22_1`,
  bancoTipoCambio: `${BANCO_ITM}tc_tipoCambioValor_v0_26_1`,
  bancoNombre: `${BANCO}datos_nombre`,
  bancoMoneda: `${BANCO}_idu_moneda`,
} as const;

const ITM = `${V}venta.ITM_|_x_ventaID::`;
const INV = `${V}inv.ITM_|_x_ventaID::`;
const PO = `${V}poFactura_|_x_ventaID::`;

/** Portal de conceptos de la venta. */
export const CONCEPTOS = {
  portal: 'Conceptos',
  sku: `${INV}itm_SKU`,
  marca: `${INV}itm_Marca`,
  nombre: `${INV}itm_Name`,
  nombreCompleto: `${INV}itm_Name_Display`,
  cuentaContable: `${INV}cuentaContable_ingresoOrInventario_v0_27_1`,
  clasificacion: (n: number) =>
    `${V}invITM_classify${n}|_x_ventaID::name_v0_20_0`,
  satClave: `${INV}_id_satClavePS`,
  satNombre: `${V}satPS_|_x_ventaID::itm_Nombre`,
  unidadVenta: `${INV}_idu_satUnitUso`,
  unidadContenido: `${INV}_idu_satUnitCont`,
  contenido: `${INV}contenidoCantidad`,
  tipo: `${INV}itm_is_0product_1servicio_2activo`,
  qty: `${ITM}qty`,
  precioUnitario: `${ITM}unit_mont_GranTotal`,
  costoUnitario: `${ITM}unit_margin_costo`,
  costoSubTotal: `${ITM}sub_margin_costo`,
  importeSinDescuento: `${ITM}sub_mont_sinDiscount_sinIEPS`,
  descuento: `${ITM}sub_discount_Monto`,
  importeConDescuento: `${ITM}sub_mont_conDiscount_sinIEPS`,
  iva: `${ITM}sub_tax_contraIVA`,
  ieps: `${ITM}sub_tax_contraIEPS`,
  ivaRetenido: `${ITM}sub_tax_favorIVAret_v0_18_1`,
  isrRetenido: `${ITM}sub_tax_favorISRret_v0_18_1`,
  granTotal: `${ITM}sub_mont_GranTotal`,
  ordenCompraItm: `${ITM}_idu_poITM`,
  ordenCompraId: `${PO}_id_po`,
  ordenCompraSerieFolio: `${PO}comprobanteDisplay_serieFolio_v0_18_1`,
  ordenCompraFecha: `${PO}comprobanteDisplay_Fecha_v0_18_1`,
  lote: `${V}LOT_|_x_ventaID::lotTenent_displaySerieMasNumber_v0_20_1r`,
} as const;

const B = 'contBanco.ITM|';
const CLIENTE_INGRESO = `${B}CLIENTE.ingreso|_x_bancoItmID::`;

/** Campos del movimiento de banco (tabla base de apiExport_Ingresos_Bancos). */
export const BAN = {
  folio: '__id_bancoITM',
  fecha: '_fecha',
  abono: 'monto_ORIG_abono_v0_22_1',
  saldo: 'saldo_ORIG_porComplementar_v0_22_1',
  tipoCambio: 'tc_tipoCambioValor_v0_26_1',
  formaPago: '_idu_formaPago_v0_22_1',
  banco: `${B}contBANCO_|_x_bancoID::datos_nombre`,
  moneda: `${B}contBANCO_|_x_bancoID::_idu_moneda`,
  /** Cliente del ingreso; vacío o 0 = depósito no identificado. */
  clienteIngreso: `${B}contINGRESO_|_x_bancoItmID::_concil_id_cliente`,
  clienteId: `${CLIENTE_INGRESO}___id_cliente`,
  cliente: `${CLIENTE_INGRESO}destLocal_dirNombreComercial`,
  razonSocial: `${CLIENTE_INGRESO}fiscal_RazonSocial`,
  rfc: `${CLIENTE_INGRESO}fiscal_RFC`,
  cuentaContable: `${CLIENTE_INGRESO}cuentaContableTemp_v0_20_2r`,
  clasificacion: (n: number) =>
    `${B}prefCliente.ingreso|_x_IDUclassify${n}::name`,
  repCliente: `${B}ingreso.user.repVent|_x_id_userName::userData_nombre_Completo`,
} as const;
