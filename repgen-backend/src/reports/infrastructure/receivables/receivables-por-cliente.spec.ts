import type { ReportReceivablesRecord } from '../../domain/receivables';
import { SIN_IDENTIFICAR, resumirPorCliente } from './receivables-por-cliente';
import esperado from './__golden__/esperado.json';

/*
 * Reglas de "Resumen por cliente" (ficha de CxC). Parte del detalle aprobado
 * en __golden__/esperado.json, corte 01/11/2026.
 */

const corte = esperado.fechaCorte;
const detalle = esperado.data as ReportReceivablesRecord[];
const resumen = resumirPorCliente(detalle, corte);
const clientes = resumen.filter((c) => c.cliente !== SIN_IDENTIFICAR);
const suma = (filas: object[], campo: string) =>
  filas.reduce(
    (s, f) => s + ((f as Record<string, number | null>)[campo] ?? 0),
    0,
  );

describe('resumirPorCliente', () => {
  it('una fila por cliente del detalle y los no identificados al final', () => {
    const ids = new Set(
      detalle
        .filter((f) => f.tipoTransaccion !== 'Abono no identificado')
        .map((f) => f.clienteId),
    );
    expect(clientes.map((c) => c.clienteId).sort()).toEqual([...ids].sort());
    expect(resumen.at(-1)).toMatchObject({
      cliente: SIN_IDENTIFICAR,
      clienteId: null,
      clienteSaldoFiscal: null,
      abonoSaldoNoAplicado: suma(
        detalle.filter((f) => f.tipoTransaccion === 'Abono no identificado'),
        'abonoMontoSinIdentificar',
      ),
    });
  });

  it('las sumas por cliente dan las del detalle', () => {
    for (const campo of [
      'facturaSaldoVencido',
      'facturaSaldoPorVencer',
      'facturaNoCobrarGranTotal',
      'abonoSaldoNoAplicado',
      'cargoSaldoNoAplicado',
    ]) {
      expect(suma(clientes, campo)).toBeCloseTo(
        suma(
          detalle.filter((f) => f.tipoTransaccion !== 'Abono no identificado'),
          campo,
        ),
        2,
      );
    }
  });

  it('cuadra las tres fórmulas del ERP en cada cliente', () => {
    for (const c of clientes) {
      expect(c.facturaSaldoPendiente).toBeCloseTo(
        c.facturaSaldoVencido! + c.facturaSaldoPorVencer!,
        2,
      );
      expect(c.clienteSaldoAFavor).toBeCloseTo(
        c.abonoSaldoNoAplicado! + c.cargoSaldoNoAplicado!,
        2,
      );
      expect(c.clienteSaldoFiscal).toBeCloseTo(
        c.facturaSaldoPendiente! +
          c.facturaNoCobrarGranTotal! -
          c.clienteSaldoAFavor!,
        2,
      );
    }
  });

  it('un cliente con facturas y un abono por aplicar queda en una sola fila', () => {
    const conAbono = detalle.find(
      (f) => f.tipoTransaccion === 'Abono por aplicar',
    )!;
    const fila = clientes.filter((c) => c.clienteId === conAbono.clienteId);
    expect(fila).toHaveLength(1);
    expect(fila[0].abonoSaldoNoAplicado).toBeGreaterThan(0);
  });

  it('ordena por nombre comercial', () => {
    const nombres = clientes.map((c) => c.cliente);
    expect(nombres).toEqual(
      [...nombres].sort((a, b) => a.localeCompare(b, 'es')),
    );
  });

  it('factura "No cobrar" y cargo por aplicar: entran al saldo fiscal', () => {
    const base = detalle.find((f) => f.tipoTransaccion === 'Factura vencida')!;
    const otro = { ...base, clienteId: 999_001, cliente: 'Cliente Prueba' };
    const filas: ReportReceivablesRecord[] = [
      {
        ...otro,
        tipoTransaccion: 'Factura cerrada: No cobrar',
        facturaSaldoVencido: 0,
        facturaSaldoPorVencer: 0,
        facturaNoCobrarGranTotal: 500,
      },
      {
        ...otro,
        tipoTransaccion: 'Cargo por aplicar',
        facturaSaldoVencido: null,
        facturaSaldoPorVencer: null,
        facturaNoCobrarGranTotal: null,
        cargoSaldoNoAplicado: 120,
      },
    ];
    const [fila] = resumirPorCliente(filas, corte);
    expect(fila).toMatchObject({
      facturaNoCobrarGranTotal: 500,
      cargoSaldoNoAplicado: 120,
      clienteSaldoAFavor: 120,
      clienteSaldoFiscal: 380,
    });
  });

  it('sin abonos no identificados no agrega la última fila', () => {
    const soloClientes = detalle.filter(
      (f) => f.tipoTransaccion !== 'Abono no identificado',
    );
    expect(
      resumirPorCliente(soloClientes, corte).some(
        (c) => c.cliente === SIN_IDENTIFICAR,
      ),
    ).toBe(false);
  });
});
