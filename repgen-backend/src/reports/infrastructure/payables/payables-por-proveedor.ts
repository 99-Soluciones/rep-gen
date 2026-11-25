import type {
  ReportPayablesRecord,
  ReportPayablesSupplierRecord,
} from '../../domain/payables';
import { redondear } from '../shared/fm-parsers';

/*
 * Resumen por proveedor (ficha de CxP, "Resumen por proveedor"): suma por
 * proveedor las filas del detalle ya calculadas al corte. No repite la lógica
 * del corte. Espejo de receivables-por-cliente.
 */

export const SIN_IDENTIFICAR = 'EGRESOS SIN IDENTIFICAR';
export const SIN_PROVEEDOR = 'SIN PROVEEDOR';

const SALDOS = [
  'facturaSaldoVencido',
  'facturaSaldoPorVencer',
  'facturaNoPagarMonto',
  'cargoSaldoNoAplicado',
  'abonoSaldoNoAplicado',
] as const;
type Saldo = (typeof SALDOS)[number];

const DATOS = [
  'proveedorId',
  'proveedorRazonSocial',
  'proveedorRfc',
  'proveedorCuentaContable',
  'proveedorAcuerdos',
] as const;

const hayMonto = (n: number | null) => Math.abs(n ?? 0) >= 0.005;

/** Primer valor no vacío entre las filas del proveedor. */
const primero = <K extends keyof ReportPayablesRecord>(
  filas: ReportPayablesRecord[],
  campo: K,
): ReportPayablesRecord[K] | null =>
  filas.find((f) => f[campo] !== null && f[campo] !== '')?.[campo] ?? null;

function resumen(
  fechaCorte: string,
  filas: ReportPayablesRecord[],
): ReportPayablesSupplierRecord {
  const s = Object.fromEntries(
    SALDOS.map((k) => [
      k,
      redondear(filas.reduce((suma, f) => suma + (f[k] ?? 0), 0)),
    ]),
  ) as Record<Saldo, number>;
  const vigentes = redondear(s.facturaSaldoVencido + s.facturaSaldoPorVencer);
  const aFavor = redondear(s.cargoSaldoNoAplicado + s.abonoSaldoNoAplicado);
  return {
    fechaCorte,
    proveedor: filas[0].proveedor || SIN_PROVEEDOR,
    ...(Object.fromEntries(DATOS.map((k) => [k, primero(filas, k)])) as Pick<
      ReportPayablesSupplierRecord,
      (typeof DATOS)[number]
    >),
    proveedorSaldoFiscal: redondear(vigentes + s.facturaNoPagarMonto - aFavor),
    facturaSaldoPendiente: vigentes,
    ...s,
    proveedorSaldoAFavor: aFavor,
  };
}

/**
 * Una fila por proveedor con algún saldo distinto de 0, ordenadas por nombre,
 * y al final los cargos no identificados juntos en una sola fila.
 */
export function resumirPorProveedor(
  filas: ReportPayablesRecord[],
  fechaCorte: string,
): ReportPayablesSupplierRecord[] {
  const grupos = new Map<string, ReportPayablesRecord[]>();
  let sinIdentificar = 0;
  for (const fila of filas) {
    if (fila.tipoTransaccion === 'Cargo no identificado') {
      sinIdentificar += fila.cargoMontoSinIdentificar ?? 0;
      continue;
    }
    const clave =
      fila.proveedorId !== null
        ? `id:${fila.proveedorId}`
        : `nombre:${fila.proveedor}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), fila]);
  }

  const proveedores = [...grupos.values()]
    .map((g) => resumen(fechaCorte, g))
    .filter((p) => SALDOS.some((k) => hayMonto(p[k])))
    .sort((a, b) => a.proveedor.localeCompare(b.proveedor, 'es'));

  if (!hayMonto(sinIdentificar)) return proveedores;
  return [
    ...proveedores,
    {
      fechaCorte,
      proveedorId: null,
      proveedor: SIN_IDENTIFICAR,
      proveedorRazonSocial: null,
      proveedorRfc: null,
      proveedorCuentaContable: null,
      proveedorAcuerdos: null,
      proveedorSaldoFiscal: null,
      facturaSaldoPendiente: null,
      facturaSaldoVencido: null,
      facturaSaldoPorVencer: null,
      facturaNoPagarMonto: null,
      proveedorSaldoAFavor: null,
      cargoSaldoNoAplicado: redondear(sinIdentificar),
      abonoSaldoNoAplicado: null,
    },
  ];
}
