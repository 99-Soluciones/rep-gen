/**
 * Nombres de campo de los layouts apiExport_CxC_Facturas y apiExport_CxC_Bancos.
 * Ficha: docs/reports/fichas/receivables/receivables.md
 */
export const LAYOUT_FACTURAS = 'apiExport_CxC_Facturas';
export const LAYOUT_BANCOS = 'apiExport_CxC_Bancos';

const CLIENTE = 'venta_|CLIENTE_|_x_clienteID::';
export const FAC = {
  clienteId: `${CLIENTE}___id_cliente`,
  cliente: `${CLIENTE}destLocal_dirNombreComercial`,
  razonSocial: `${CLIENTE}fiscal_RazonSocial`,
  rfc: `${CLIENTE}fiscal_RFC`,
  cuentaContable: `${CLIENTE}cuentaContableTemp_v0_20_2r`,
  repCliente: 'venta_|USER.repVent_|_x_clienteID::userData_nombre_Completo',
  clasificacion: (n: number) =>
    `venta_|cliente.Classify${n}|_x_clienteID::name`,
  serieFolio: 'cfdi_facturaSerieFolio_v0_18_1',
  granTotal: 'monto_GranTotal',
  uuid: 'cfdi_UUID',
  timbrado: 'cfdi_FacturaFechaTimbrar',
  metodoPago: '_idu_cdfi_metoPago',
  diasCredito: 'credit_dias',
  area: 'area__is_Cotizacion_Ventas_Facturacion_Almacen_Repartos_Cancelada',
  cancelacion: 'cfdi_CANCEL_timestamp_v0_23_1r',
  repFactura: 'venta_|USER_|_x_repVent::userData_nombre_Completo',
  repCobranza:
    'venta_|USER.repCobranza_|_x_clienteID::userData_nombre_Completo',
  ventaId: '__id_venta',
  saldo: 'saldo_Pendiente_GranTotal',
  estatusSaldo: 'saldo_isPendiente_Cobrado_NoCobrar_Cancelado',
  fechaLimite: 'saldo.FechaLimitePago',
  fechaNoCobrar: 'saldo_fecha_liquidacion_bancoITM_noCobrar',
  /** IVA / IEPS de la factura "No cobrar"; vacío en las demás. */
  noCobrarIva: 'monto_contraIVA',
  noCobrarIeps: 'monto_contraIEPS',
} as const;

const PAGO = 'venta_|contIngreso.ITM|_x_ventaID::';
export const PAGOS_VENTA = {
  portal: 'PagosVenta',
  montoMxn: `${PAGO}app_MXN_GranTotal`,
  fecha: `${PAGO}fecha_ingresoITM_fechaDelComplemento`,
} as const;

const B = 'contBanco.ITM|';
export const BAN = {
  folio: '__id_bancoITM',
  fecha: '_fecha',
  abono: 'monto_ORIG_abono_v0_22_1',
  cargo: 'monto_ORIG_cargo_v0_22_1',
  saldo: 'saldo_ORIG_porComplementar_v0_22_1',
  tipoCambio: 'tc_tipoCambioValor_v0_26_1',
  banco: `${B}contBANCO_|_x_bancoID::datos_nombre`,
  bancoCuentaContable: `${B}contBANCO_|_x_bancoID::cuentaContable_Temp_v0_20_2r`,
  referencia: 'mConceptoDeBancoTexto_v0_20_0',
  ingresoId: `${B}contINGRESO_|_x_bancoItmID::__id_ingreso`,
  egresoId: `${B}contEGRESO_|_x_bancoItmID::__id_egreso`,
  clienteIngreso: `${B}contINGRESO_|_x_bancoItmID::_concil_id_cliente`,
  clienteEgreso: `${B}contEGRESO_|_x_bancoItmID::_concil_id_cliente`,
  /** Monto registrado en el ingreso / egreso del cliente (MXN); puede ser menor que el movimiento. */
  montoIngreso: `${B}contINGRESO_|_x_bancoItmID::monto_MXN_GranTotal`,
  montoEgreso: `${B}contEGRESO_|_x_bancoItmID::monto_MXN_GranTotal`,
} as const;

export type LadoBanco = 'ingreso' | 'egreso';

/** Datos del cliente por la relación del ingreso (abonos) o del egreso (cargos). */
export const banCliente = (lado: LadoBanco) => ({
  id: `${B}CLIENTE.${lado}|_x_bancoItmID::___id_cliente`,
  nombre: `${B}CLIENTE.${lado}|_x_bancoItmID::destLocal_dirNombreComercial`,
  razonSocial: `${B}CLIENTE.${lado}|_x_bancoItmID::fiscal_RazonSocial`,
  rfc: `${B}CLIENTE.${lado}|_x_bancoItmID::fiscal_RFC`,
  cuentaContable: `${B}CLIENTE.${lado}|_x_bancoItmID::cuentaContableTemp_v0_20_2r`,
  clasificacion: (n: number) =>
    `${B}prefCliente.${lado}|_x_IDUclassify${n}::name`,
  rep: `${B}${lado}.user.repVent|_x_id_userName::userData_nombre_Completo`,
});

/** Portal de aplicaciones del abono (ingreso) o del cargo (egreso). */
export const APLICACIONES = {
  ingreso: {
    portal: `${B}contINGRESO.ITM|_x_bancoItmID`,
    montoMxn: `${B}contINGRESO.ITM|_x_bancoItmID::app_MXN_GranTotal`,
    tipoCambio: `${B}contINGRESO.ITM|_x_bancoItmID::app_tc_complemento_v0_28_1`,
    fecha: `${B}contINGRESO.ITM|_x_bancoItmID::fecha_ingresoITM_fechaDelComplemento`,
  },
  egreso: {
    portal: `${B}contEgreso.ITM|_x_bancoItmID`,
    montoMxn: `${B}contEgreso.ITM|_x_bancoItmID::app_MXN_GranTotal`,
    tipoCambio: `${B}contEgreso.ITM|_x_bancoItmID::app_tc_complemento_v0_28_1`,
    fecha: `${B}contEgreso.ITM|_x_bancoItmID::fecha_egresoITM_fechaDelComplemento_v0_20_2r`,
  },
} as const;
