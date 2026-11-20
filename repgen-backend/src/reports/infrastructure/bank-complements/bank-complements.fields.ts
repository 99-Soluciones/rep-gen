/**
 * Nombres de campo del layout apiExport_Bancos_Complementos (tabla base contBanco.ITM).
 * Ficha: docs/reports/fichas/bank-complements/bank-complements.md
 */
export const LAYOUT = 'apiExport_Bancos_Complementos';

const P = 'contBanco.ITM|';

/** Campos del movimiento de banco (fieldData). */
export const MOV = {
  id: '__id_bancoITM',
  fecha: '_fecha',
  formaPago: '_idu_formaPago_v0_22_1',
  concepto: 'mConceptoDeBancoTexto_v0_20_0',
  abono: 'monto_ORIG_abono_v0_22_1',
  cargo: 'monto_ORIG_cargo_v0_22_1',
  saldoResultante: 'monto_ORIG_bancoRunningSaldo',
  saldoPorIdentificar: 'saldo_ORIG_porID_v0_22_1',
  saldoPorComplementar: 'saldo_ORIG_porComplementar_v0_22_1',
  textoComplemento: 'mConciliacionTexto_parteDelCOMPLEMENTO_v0_22_1',
  tipoCambio: 'tc_tipoCambioValor_v0_26_1',
  cuentaContable: `${P}satCUENTA_|_satCuentaIDU::cuenta_codigoAg_v0_21_2_1`,
} as const;

const B = `${P}contBANCO_|_x_bancoID::`;
export const BANCO = {
  portal: 'Banco',
  nombre: `${B}datos_nombre`,
  cuenta: `${B}datos_cuentaNumero`,
  moneda: `${B}_idu_moneda`,
} as const;

const I = `${P}contINGRESO_|_x_bancoItmID::`;
const CI = `${P}CLIENTE.ingreso|_x_bancoItmID::`;
/** Conciliaciones de ingreso, con su cliente. */
export const INGRESO = {
  portal: 'contIngreso',
  id: `${I}__id_ingreso`,
  montoTotal: `${I}monto_MXN_GranTotal`,
  estado: `${I}isT_Abierto_Cerrado`,
  clienteId: `${I}_concil_id_cliente`,
  proveedorId: `${I}_concil_id_prov`,
  transferenciaId: `${I}_concil_id_egresoIDtransfer|v0.18.1`,
  nombre: `${CI}destLocal_dirNombreComercial`,
  razonSocial: `${CI}fiscal_RazonSocial`,
  rfc: `${CI}fiscal_RFC`,
} as const;

const E = `${P}contEGRESO_|_x_bancoItmID::`;
const PE = `${P}PROV.egreso|_x_bancoItmID::`;
/** Conciliaciones de egreso, con su proveedor. */
export const EGRESO = {
  portal: 'contEgreso',
  id: `${E}__id_egreso`,
  montoTotal: `${E}monto_MXN_GranTotal`,
  estado: `${E}isT_Abierto_Cerrado`,
  clienteId: `${E}_concil_id_cliente`,
  proveedorId: `${E}_concil_id_prov`,
  transferenciaId: `${E}_concil_id_ingresoIDtransfer|v0.18.1`,
  nombre: `${PE}local_NombreComercial`,
  razonSocial: `${PE}fiscal_RazonSocial`,
  rfc: `${PE}fiscal_RFC`,
} as const;

const II = `${P}contINGRESO.ITM|_x_bancoItmID::`;
const V = `${P}VENTA|_x_bancoItmID::`;
/** Complementos de ingreso, con su factura de venta. */
export const COMP_INGRESO = {
  portal: 'ComplementosIngreso',
  conciliacionId: `${II}_id_ingreso`,
  monto: `${II}app_MXN_GranTotal`,
  fecha: `${II}fecha_ingresoITM_fechaDelComplemento`,
  periodoFiscal: `${II}fecha_fiscalDisplay_v0_21_3_2r`,
  repSerie: `${II}cfdiCompPago_Serie`,
  repFolio: `${II}cfdiCompPago_Folio`,
  repUuid: `${II}cfdiCompPago_uuid`,
  ventaId: `${II}_id_relacionado_Venta`,
  facturaSerieFolio: `${V}cfdi_facturaSerieFolio_v0_18_1`,
  facturaFecha: `${V}cfdi_FacturaFechaTimbrar`,
  facturaGranTotal: `${V}monto_GranTotal`,
  facturaUuid: `${V}cfdi_UUID`,
  facturaMetodoPago: `${V}_idu_cdfi_metoPago`,
} as const;

const EI = `${P}contEgreso.ITM|_x_bancoItmID::`;
const PF = `${P}poFACTURA|_x_bancoItmID::`;
/** Complementos de egreso, con su factura de proveedor. */
export const COMP_EGRESO = {
  portal: 'ComplementosEgreso',
  conciliacionId: `${EI}_id_egreso`,
  monto: `${EI}app_MXN_GranTotal`,
  fecha: `${EI}fecha_egresoITM_fechaDelComplemento_v0_20_2r`,
  periodoFiscal: `${EI}fecha_fiscalDisplay_v0_21_3_2`,
  repSerie: `${EI}cPagoCFDI_serie_v0_15_1`,
  repFolio: `${EI}cPagoCFDI_folio_v0_15_1`,
  repUuid: `${EI}cPagoCFDI_UUID_v0_15_1`,
  facturaSerie: `${PF}cfdi_serie_v0_15_1`,
  facturaFolio: `${PF}cfdi_folio`,
  facturaFecha: `${PF}cfdi_fecha`,
  facturaGranTotal: `${PF}monto_MXN_GranTotal`,
  facturaUuid: `${PF}cfdi_UUID`,
  facturaMetodoPago: `${PF}cfdi_isPPDoPUE_v0_15_1`,
} as const;
