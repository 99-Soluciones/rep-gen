import type { ReportPayablesRecord } from '../../domain/payables';
import {
  SIN_IDENTIFICAR,
  SIN_PROVEEDOR,
  resumirPorProveedor,
} from './payables-por-proveedor';
import esperado from './__golden__/esperado.json';

/*
 * Reglas de "Resumen por proveedor" (ficha de CxP). Parte del detalle
 * aprobado en __golden__/esperado.json, corte 15/07/2026.
 */

const detalle = esperado as ReportPayablesRecord[];
const corte = detalle[0].fechaCorte;
const resumen = resumirPorProveedor(detalle, corte);
const suma = (filas: object[], campo: string) =>
  filas.reduce(
    (s, f) => s + ((f as Record<string, number | null>)[campo] ?? 0),
    0,
  );
const fila = (parcial: Partial<ReportPayablesRecord>) =>
  ({
    tipoTransaccion: 'Factura vencida',
    proveedorId: 1,
    proveedor: 'Proveedor',
    ...parcial,
  }) as ReportPayablesRecord;

describe('resumirPorProveedor', () => {
  it('las sumas por proveedor dan las del detalle', () => {
    const proveedores = resumen.filter((p) => p.proveedor !== SIN_IDENTIFICAR);
    for (const campo of [
      'facturaSaldoVencido',
      'facturaSaldoPorVencer',
      'facturaNoPagarMonto',
      'cargoSaldoNoAplicado',
      'abonoSaldoNoAplicado',
    ]) {
      expect(suma(proveedores, campo)).toBeCloseTo(suma(detalle, campo), 2);
    }
  });

  it('los cargos no identificados van juntos al final y no suman al saldo fiscal', () => {
    expect(resumen.at(-1)).toMatchObject({
      proveedor: SIN_IDENTIFICAR,
      proveedorSaldoFiscal: null,
      cargoSaldoNoAplicado: suma(
        detalle.filter((f) => f.tipoTransaccion === 'Cargo no identificado'),
        'cargoMontoSinIdentificar',
      ),
    });
  });

  it('saldo fiscal = vigentes + no pagar − pagos y devoluciones no aplicados', () => {
    const [p] = resumirPorProveedor(
      [
        fila({ facturaSaldoVencido: 100, facturaSaldoPorVencer: 0 }),
        fila({ facturaSaldoVencido: 0, facturaSaldoPorVencer: 50 }),
        fila({
          tipoTransaccion: 'Factura cerrada: No pagar',
          facturaNoPagarMonto: 10,
        }),
        fila({
          tipoTransaccion: 'Cargo por aplicar',
          cargoSaldoNoAplicado: 30,
        }),
        fila({ tipoTransaccion: 'Abono por aplicar', abonoSaldoNoAplicado: 5 }),
      ],
      corte,
    );
    expect(p).toMatchObject({
      facturaSaldoPendiente: 150,
      proveedorSaldoAFavor: 35,
      proveedorSaldoFiscal: 125,
    });
  });

  it('una compra sin proveedor sale como "SIN PROVEEDOR"; un proveedor en 0 no sale', () => {
    const filas = resumirPorProveedor(
      [
        fila({ proveedorId: null, proveedor: '', facturaNoPagarMonto: 0.01 }),
        fila({ proveedorId: 2, facturaSaldoVencido: 0 }),
      ],
      corte,
    );
    expect(filas.map((f) => f.proveedor)).toEqual([SIN_PROVEEDOR]);
  });
});
