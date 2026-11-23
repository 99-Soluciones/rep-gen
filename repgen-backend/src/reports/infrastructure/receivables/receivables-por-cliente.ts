import type {
  ReportReceivablesClientRecord,
  ReportReceivablesRecord,
} from '../../domain/receivables';
import { redondear } from '../shared/fm-parsers';

/*
 * Resumen por cliente (ficha de CxC, "Resumen por cliente"): suma por cliente
 * las filas del detalle ya calculadas al corte. No repite la lógica del corte.
 */

export const SIN_IDENTIFICAR = 'INGRESOS SIN IDENTIFICAR';

type Saldos = Pick<
  ReportReceivablesClientRecord,
  | 'facturaSaldoVencido'
  | 'facturaSaldoPorVencer'
  | 'facturaNoCobrarGranTotal'
  | 'abonoSaldoNoAplicado'
  | 'cargoSaldoNoAplicado'
>;
const SALDOS = [
  'facturaSaldoVencido',
  'facturaSaldoPorVencer',
  'facturaNoCobrarGranTotal',
  'abonoSaldoNoAplicado',
  'cargoSaldoNoAplicado',
] as const;

const DATOS = [
  'clienteId',
  'clienteRazonSocial',
  'clienteRfc',
  'clasificacion1',
  'clasificacion2',
  'clasificacion3',
  'clasificacion4',
  'clienteCuentaContable',
  'clienteRepDeVenta',
] as const;

type Grupo = { filas: ReportReceivablesRecord[]; saldos: Saldos };

const hayMonto = (n: number | null) => Math.abs(n ?? 0) >= 0.005;

/** Primer valor no vacío entre las filas del cliente. */
const primero = <K extends keyof ReportReceivablesRecord>(
  filas: ReportReceivablesRecord[],
  campo: K,
): ReportReceivablesRecord[K] | null =>
  filas.find((f) => f[campo] !== null && f[campo] !== '')?.[campo] ?? null;

function resumen(
  fechaCorte: string,
  { filas, saldos }: Grupo,
): ReportReceivablesClientRecord {
  const s = Object.fromEntries(
    SALDOS.map((k) => [k, redondear(saldos[k] ?? 0)]),
  ) as Record<keyof Saldos, number>;
  const vigentes = redondear(s.facturaSaldoVencido + s.facturaSaldoPorVencer);
  const aFavor = redondear(s.abonoSaldoNoAplicado + s.cargoSaldoNoAplicado);
  return {
    fechaCorte,
    cliente: filas[0].cliente,
    ...(Object.fromEntries(DATOS.map((k) => [k, primero(filas, k)])) as Pick<
      ReportReceivablesClientRecord,
      (typeof DATOS)[number]
    >),
    clienteCreditoAutorizado: primero(filas, 'clienteCreditoAutorizado'),
    clienteRepDeCobranza: primero(filas, 'facturaRepDeCobranza'),
    clienteSaldoFiscal: redondear(
      vigentes + s.facturaNoCobrarGranTotal - aFavor,
    ),
    facturaSaldoPendiente: vigentes,
    ...s,
    clienteSaldoAFavor: aFavor,
  };
}

/**
 * Una fila por cliente con algún saldo distinto de 0, ordenadas por nombre, y
 * al final los abonos no identificados juntos en una sola fila.
 */
export function resumirPorCliente(
  filas: ReportReceivablesRecord[],
  fechaCorte: string,
): ReportReceivablesClientRecord[] {
  const grupos = new Map<string, Grupo>();
  let sinIdentificar = 0;
  for (const fila of filas) {
    if (fila.tipoTransaccion === 'Abono no identificado') {
      sinIdentificar += fila.abonoMontoSinIdentificar ?? 0;
      continue;
    }
    const clave =
      fila.clienteId !== null
        ? `id:${fila.clienteId}`
        : `nombre:${fila.cliente}`;
    const grupo = grupos.get(clave) ?? { filas: [], saldos: {} as Saldos };
    grupo.filas.push(fila);
    for (const k of SALDOS)
      grupo.saldos[k] = (grupo.saldos[k] ?? 0) + (fila[k] ?? 0);
    grupos.set(clave, grupo);
  }

  const clientes = [...grupos.values()]
    .map((g) => resumen(fechaCorte, g))
    .filter((c) => SALDOS.some((k) => hayMonto(c[k])))
    .sort((a, b) => a.cliente.localeCompare(b.cliente, 'es'));

  if (!hayMonto(sinIdentificar)) return clientes;
  return [
    ...clientes,
    {
      fechaCorte,
      clienteId: null,
      cliente: SIN_IDENTIFICAR,
      clienteRazonSocial: null,
      clienteRfc: null,
      clasificacion1: null,
      clasificacion2: null,
      clasificacion3: null,
      clasificacion4: null,
      clienteCuentaContable: null,
      clienteCreditoAutorizado: null,
      clienteRepDeVenta: null,
      clienteRepDeCobranza: null,
      clienteSaldoFiscal: null,
      facturaSaldoPendiente: null,
      facturaSaldoVencido: null,
      facturaSaldoPorVencer: null,
      facturaNoCobrarGranTotal: null,
      clienteSaldoAFavor: null,
      abonoSaldoNoAplicado: redondear(sinIdentificar),
      cargoSaldoNoAplicado: null,
    },
  ];
}
