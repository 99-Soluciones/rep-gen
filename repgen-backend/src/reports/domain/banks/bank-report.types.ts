// Contrato de la API, compartido con el frontend.
export type { ReportBankRecord } from '@repgen/shared-types';
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
