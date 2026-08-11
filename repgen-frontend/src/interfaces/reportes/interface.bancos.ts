export interface IBancoData {
  fecha: string;
  formaPago: string;
  concepto: string;
  abono: number;
  cargo: number;
  estadoIngreso?: string;
  estadoEgreso?: string;
  saldoPorComplementar: number;
  tipoDeCambio?: number;
  saldoPorIdentificar?: number;
  textoComplementario?: string;
  nombre_banco?: string;
  numero_cuenta?: string;
  moneda?: string;
  nombre_comercial?: string;
  rfc?: string;
}