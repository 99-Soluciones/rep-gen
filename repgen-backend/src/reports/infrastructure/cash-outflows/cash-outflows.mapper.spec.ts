import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './cash-outflows.mapper';
import { BAN, CONCEPTOS, FAC, PAGOS_COMPRA } from './cash-outflows.fields';

/*
 * Reglas de la ficha que los datos dorados no cubren. Cada caso parte de un
 * registro real (anonimizado, en la carpeta de la ficha) y le cambia solo lo
 * que la regla necesita.
 */

type Registro = RawRecord & {
  portalData: Record<string, Record<string, unknown>[]>;
};

const ficha = join(__dirname, '../../../../docs/reports/fichas/cash-outflows');
const leer = (archivo: string): Registro[] =>
  (
    JSON.parse(readFileSync(join(ficha, archivo), 'utf8')) as {
      response: { data: Registro[] };
    }
  ).response.data;
const PAGOS = leer('Egresos_Pagos_ResponseFM');
const BANCOS = leer('Egresos_Bancos_ResponseFM');

const noviembre = { startDate: '2026-11-01', endDate: '2026-11-30' };
const HOY = '2026-11-26';

const buscar = (lista: Registro[], campo: string, valor: number): Registro => {
  const r = lista.find((x) => x.fieldData[campo] === valor);
  if (!r) throw new Error(`No está ${campo} = ${valor} en la ficha`);
  return structuredClone(r);
};
const factura = (oc: number) => buscar(PAGOS, FAC.compraId, oc);
const cargo = (folio: number) => buscar(BANCOS, BAN.folio, folio);

const porFactura = (p: RawRecord[], b: RawRecord[] = [], r = noviembre) =>
  cleanData(p, b, r, 'factura', HOY);
const porConcepto = (p: RawRecord[], r = noviembre) =>
  cleanData(p, [], r, 'concepto', HOY);

describe('cash-outflows cleanData — reglas', () => {
  /** OC 877 (09/2025): $40,600 en dos pagos; el 4224 es una compensación sin banco. */
  const septiembre2025 = { startDate: '2025-09-01', endDate: '2025-09-30' };

  it('pago sin banco (compensación, forma de pago 17): no sale', () => {
    const filas = porFactura([factura(877)], [], septiembre2025);
    expect(filas.map((f) => f.bancoFolioTransaccion)).toEqual([4217]);
  });

  it('abono parcial: importes prorrateados por pago ÷ gran total', () => {
    const [fila] = porFactura([factura(877)], [], septiembre2025);
    expect(fila.pagoTasa).toBe(0.512587); // 20,811.04 / 40,600
    expect(fila.pagoGranTotalMxn).toBe(20811.04);
    expect(fila.importeConDescuentoMxn).toBe(17940.55); // 35,000 × tasa
    expect(fila.ivaMxn).toBe(2870.49); // 5,600 × tasa
    expect(fila.facturaGranTotalMxn).toBe(40600); // completo
    const [concepto] = porConcepto([factura(877)], septiembre2025);
    expect(concepto.cantidad).toBe(10); // del concepto completo
    expect(concepto.pagoGranTotalMxn).toBe(20811.04);
  });

  it('el rango incluye el primer y el último día', () => {
    const f = factura(1851);
    const pago = f.portalData[PAGOS_COMPRA.portal][0];
    f.portalData[PAGOS_COMPRA.portal] = [
      '10/31/2026',
      '11/01/2026',
      '11/30/2026',
      '12/01/2026',
    ].map((dia) => ({ ...pago, [PAGOS_COMPRA.fecha]: dia }));
    expect(porFactura([f]).map((r) => r.pagoFecha)).toEqual([
      '2026-11-01',
      '2026-11-30',
    ]);
  });

  it('estatus de hoy: Liquidado (Cerrado), Vencida y Vigente (Pagos)', () => {
    const estatus = (area: string, limite: string) => {
      const f = factura(1851);
      f.fieldData[FAC.area] = area;
      f.fieldData[FAC.fechaLimiteDePago] = limite;
      return porFactura([f])[0].facturaEstatus;
    };
    expect(estatus('Cerrado', '11/01/2026')).toBe('Liquidado');
    expect(estatus('Pagos', '11/25/2026')).toBe('Vencida');
    expect(estatus('Pagos', '11/26/2026')).toBe('Vigente');
  });

  it('factura sin CFDI: folio y fecha en null', () => {
    const f = factura(1851);
    f.fieldData[FAC.uuid] = '';
    const [fila] = porFactura([f]);
    expect(fila.facturaSerieFolio).toBeNull();
    expect(fila.facturaFecha).toBeNull();
  });

  it('tipo de gasto normalizado; un gasto no lleva bodega ni entrega', () => {
    const f = factura(1832);
    const [c1, c2] = f.portalData[CONCEPTOS.portal];
    c1[CONCEPTOS.tipo] = 'GASTO';
    c1[CONCEPTOS.fechaEntrega] = '11/12/2026';
    c2[CONCEPTOS.tipo] = 'STOCK';
    c2[CONCEPTOS.fechaEntrega] = '';
    f.portalData[CONCEPTOS.portal] = [c1, c2];
    const [gasto, stock] = porConcepto([f]);
    expect(gasto).toMatchObject({
      tipoDeConcepto: 'Gasto',
      bodegaNombre: null,
      bodegaEntregaEstatus: null,
      bodegaEntregaFecha: null,
    });
    expect(stock).toMatchObject({
      tipoDeConcepto: 'Stock',
      bodegaEntregaEstatus: 'Pendiente',
      bodegaEntregaFecha: null,
    });
  });

  it('subtotal del concepto con más de 2 decimales: se redondea a centavos', () => {
    const f = factura(1851);
    f.portalData[CONCEPTOS.portal][0][CONCEPTOS.granTotal] = 15578.5245;
    expect(porConcepto([f])[0].pagoGranTotalMxn).toBe(15578.52);
  });

  describe('cargos sin aplicar', () => {
    it('con proveedor: Pago sin aplicar, por el saldo por complementar', () => {
      const [fila] = porFactura([], [cargo(7699)]);
      expect(fila.tipoRenglon).toBe('Pago sin aplicar');
      expect(fila.proveedor).not.toBe('NO IDENTIFICADO');
      expect(fila.pagoGranTotalMxn).toBe(45991.68);
    });

    it('proveedor 0 o vacío: Pago no identificado', () => {
      for (const prov of [0, '']) {
        const b = cargo(7699);
        b.fieldData[BAN.proveedorEgreso] = prov;
        const [fila] = porFactura([], [b]);
        expect(fila.tipoRenglon).toBe('Pago no identificado');
        expect(fila.proveedor).toBe('NO IDENTIFICADO');
        expect(fila.proveedorRfc).toBeNull();
      }
    });

    it('texto TRASPASO ENTRE CUENTAS: traspaso, aunque tenga proveedor', () => {
      const conProveedor = cargo(7699);
      conProveedor.fieldData[BAN.concepto] = 'TRASPASO ENTRE CUENTAS REF 1';
      const sinProveedor = cargo(7600);
      sinProveedor.fieldData[BAN.concepto] = 'TRASPASO ENTRE CUENTAS REF 2';
      expect(
        porFactura([], [conProveedor, sinProveedor]).map((f) => f.tipoRenglon),
      ).toEqual(['Traspaso entre cuentas', 'Traspaso entre cuentas']);
    });

    it('cargo ya aplicado (saldo 0) o abono: no sale', () => {
      const aplicado = cargo(7575); // saldo por complementar 0
      const abono = cargo(7699);
      abono.fieldData[BAN.cargo] = 0;
      expect(porFactura([], [aplicado, abono])).toEqual([]);
    });
  });

  it('orden: aplicado, sin aplicar, no identificado, traspaso', () => {
    const traspaso = cargo(7600);
    traspaso.fieldData[BAN.concepto] = 'TRASPASO ENTRE CUENTAS';
    const noIdentificado = cargo(7699);
    noIdentificado.fieldData[BAN.proveedorEgreso] = 0;
    const filas = porFactura(
      [factura(1851)],
      [traspaso, noIdentificado, cargo(7699)],
    );
    expect(filas.map((f) => f.tipoRenglon)).toEqual([
      'Pago aplicado',
      'Pago sin aplicar',
      'Pago no identificado',
      'Traspaso entre cuentas',
    ]);
  });

  it('registro que no cumple el schema: error, no un reporte con huecos', () => {
    const f = factura(1851);
    delete f.fieldData[FAC.granTotal];
    expect(() => porFactura([f])).toThrow('Registro de Egresos inválido');
  });
});
