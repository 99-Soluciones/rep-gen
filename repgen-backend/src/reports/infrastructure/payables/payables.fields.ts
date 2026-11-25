/**
 * Nombres de campo de los layouts apiExport_CxP_Facturas y apiExport_CxP_Bancos.
 * Ficha: docs/reports/fichas/payables/payables.md
 */
export const LAYOUT_FACTURAS = 'apiExport_CxP_Facturas';
export const LAYOUT_BANCOS = 'apiExport_CxP_Bancos';

const PROV = 'poFactura_|PROV_|_x_provID::';
export const FAC = {
  aprobada: 'area_fechaEnPagos',
  area: 'area_is_Cotizacion_noAprobado_Pagos_Cerrado',
  compraId: 'poFactura_|PO_|_x_po::__id_po',
  proveedorId: `${PROV}__id_prov`,
  proveedor: `${PROV}local_NombreComercial`,
  razonSocial: `${PROV}fiscal_RazonSocial`,
  rfc: `${PROV}fiscal_RFC`,
  cuentaContable: `${PROV}cuentaContable_Temp_v0_20_2r`,
  acuerdos: `${PROV}local_informacionAcuerdos_v0_21_1`,
  uuid: 'cfdi_UUID',
  serie: 'cfdi_serie_v0_15_1',
  folio: 'cfdi_folio',
  fechaFactura: 'cfdi_fecha',
  observaciones: 'factura_observaciones_v0_18_1',
  moneda: '_idu_moneda|v0_18_1',
  tipoCambio: 'tc_tipoCambioValor_v0_18_1',
  granTotal: 'monto_MXN_GranTotal',
  /** Lo pagado hoy; el saldo es gran total − pagado (el campo de saldo no es confiable en Pagos). */
  pagado: 'saldo_MXN_pagado_enPAGOS',
  /** Solo para la búsqueda de "No pagar": en Cerrado sí cuadra. */
  saldo: 'saldo_MXN_pendiente_GranTotal_saldoGeneral',
  fechaLimite: 'saldo_fecha_pagoLimite',
  /** Fecha de cierre: "No pagar" o liquidación. */
  fechaCerrado: 'saldo_fechaCerrado_bancoITM_noPagar',
  cerradaPor: 'area_cerradoNoPagar_user_v0_21_3_5r',
  repCompra: 'poFactura_|USER.repComp_|_x_repCompID::userData_nombre_Completo',
  iva: 'monto_MXN_tax_favorIVA',
  ieps: 'monto_MXN_tax_favorIEPSenFactura',
  tieneProductos: 'entrega_isBtieneStock',
  entregaEstatus: 'entrega_is_Entregado_Pendiente',
  entregaEstimada: 'entrega_fechaETAorig',
  entregaFecha: 'entrega_fechaAlta',
} as const;

const PAGO = 'poFactura_|cont.EGRESO_ITM|_x_facturaIDU::';
export const PAGOS_COMPRA = {
  portal: 'PagosVenta',
  montoMxn: `${PAGO}app_MXN_GranTotal`,
  fecha: `${PAGO}fecha_egresoITM_fechaDelComplemento_v0_20_2r`,
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
  proveedorIngreso: `${B}contINGRESO_|_x_bancoItmID::_concil_id_prov`,
  proveedorEgreso: `${B}contEGRESO_|_x_bancoItmID::_concil_id_prov`,
  /** Un egreso con cliente es una devolución: va en CxC. */
  clienteEgreso: `${B}contEGRESO_|_x_bancoItmID::_concil_id_cliente`,
  /** Monto registrado en el ingreso / egreso (MXN); puede ser menor que el movimiento. */
  montoIngreso: `${B}contINGRESO_|_x_bancoItmID::monto_MXN_GranTotal`,
  montoEgreso: `${B}contEGRESO_|_x_bancoItmID::monto_MXN_GranTotal`,
} as const;

export type LadoBanco = 'ingreso' | 'egreso';

/** Datos del proveedor por la relación del ingreso (abonos) o del egreso (cargos). */
export const banProveedor = (lado: LadoBanco) => {
  const p = `${B}PROV.${lado}|_x_bancoItmID::`;
  return {
    id: `${p}__id_prov`,
    nombre: `${p}local_NombreComercial`,
    razonSocial: `${p}fiscal_RazonSocial`,
    rfc: `${p}fiscal_RFC`,
    cuentaContable: `${p}cuentaContable_Temp_v0_20_2r`,
    acuerdos: `${p}local_informacionAcuerdos_v0_21_1`,
  };
};

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
