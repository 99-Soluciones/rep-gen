/**
 * La interfaz ReportBankRecord representa el formato final de cada registro en el reporte, con campos opcionales que se llenarán según la disponibilidad de datos.
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
