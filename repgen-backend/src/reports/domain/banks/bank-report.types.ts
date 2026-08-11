import { FilterModel } from '../reports.types';

/**
 * Primeras dos interfaces para la salida del reporte de bancos, con campos opcionales para facilitar la limpieza y transformación de datos.
 * La interfaz ReportBankRecord representa el formato final de cada registro en el reporte, con campos opcionales que se llenarán según la disponibilidad de datos.
 * La interfaz FilterBankModel define la estructura de los filtros que se pueden aplicar al reporte, utilizando la estructura genérica de FilterModel para cada campo relevante.
 */
export interface ReportBankRecord {
  idTransaccionBanco: number;
  fecha: string;
  formaPago: string;
  concepto: string;
  abono?: number;
  cargo?: number;
  saldoPorComplementar: number;
  tipoDeCambio?: number;
  saldoPorIdentificar?: number;
  saldoBanco?: number;
  textoComplementario?: string;
  nombre_banco?: string;
  numero_cuenta?: string;
  moneda?: string;
  cuentaContable?: string;
  estadoIngreso?: string;
  estadoEgreso?: string;
  nombre_comercial?: string;
  rfc?: string;
}
export interface FilterBankModel {
  idTransaccionBanco?: FilterModel;
  fecha?: FilterModel;
  nombre_banco?: FilterModel;
  numero_cuenta?: FilterModel;
  cuentaContable?: FilterModel;
  moneda?: FilterModel;
  formaPago?: FilterModel;
  concepto?: FilterModel;
  abono?: FilterModel;
  cargo?: FilterModel;
  saldoPorComplementar?: FilterModel;
  tipoDeCambio?: FilterModel;
  saldoPorIdentificar?: FilterModel;
  textoComplementario?: FilterModel;
  estadoIngreso?: FilterModel;
  estadoEgreso?: FilterModel;
  nombre_comercial?: FilterModel;
  rfc?: FilterModel;
}
/**
 * Interfaces para el mapeo de registros raw de bancos
 * a un formato con keys limpias, utilizando las definiciones en bankFieldMap.json.
 */
export interface BankPersonaMappedRecord {
  nombreComercial: string;
  rfc: string;
}

export interface BankMappedRecord {
  idBanco: number;
  fecha: string;
  formaPago: string;
  concepto: string;
  abono: number;
  cargo: number;
  saldoPorComplementar: number;
  saldoPorIdentificar: number;
  tipoDeCambio: number;
  textoComplementario: string;
  idTransaccionBanco: number;
  saldoBanco: number;
  banco: {
    nombre: string;
    cuentaNumero: string;
    moneda: string;
    cuentaContable: string;
  };
  ingreso: {
    notaCreditoSerieFolio: string;
    estado: string;
    estadoAlt: string;
  };
  egreso: {
    estado: string;
    estadoAlt: string;
  };
  cliente: {
    ingreso: BankPersonaMappedRecord;
    egreso: BankPersonaMappedRecord;
  };
  proveedor: {
    ingreso: BankPersonaMappedRecord;
    egreso: BankPersonaMappedRecord;
  };
}
