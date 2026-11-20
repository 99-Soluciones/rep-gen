import type { ReportPurchaseItemRecord } from "@repgen/shared-types";
import { granTotalCompras, resumenCompras } from "./calcularComprasConceptos";

const fila = (valores: Partial<ReportPurchaseItemRecord>) =>
  ({
    articuloGranTotalMxn: null,
    articuloImporteConDescuentoMxn: null,
    articuloIVAMxn: null,
    articuloIVARetenidoMxn: null,
    articuloISRretenidoMxn: null,
    facturaGranTotalMxn: null,
    facturaSaldoActual: null,
    ...valores,
  }) as ReportPurchaseItemRecord;

// OC 1703 de los datos dorados: un gasto y dos Stock, factura de 5,550.60 liquidada.
const oc1703 = [
  fila({ compraId: 1703, tipoDeConcepto: "Gasto", articuloGranTotalMxn: 406, articuloImporteConDescuentoMxn: 350, articuloIVAMxn: 56, facturaGranTotalMxn: 5550.6, facturaSaldoActual: 0 }),
  fila({ compraId: 1703, tipoDeConcepto: "Stock", articuloGranTotalMxn: 1020.8, articuloImporteConDescuentoMxn: 880, articuloIVAMxn: 140.8, facturaGranTotalMxn: 5550.6, facturaSaldoActual: 0 }),
  fila({ compraId: 1703, tipoDeConcepto: "Stock", articuloGranTotalMxn: 4123.8, articuloImporteConDescuentoMxn: 3555, articuloIVAMxn: 568.8, facturaGranTotalMxn: 5550.6, facturaSaldoActual: 0 }),
];
// OC 1769: servicio con IVA e ISR retenidos, sin pagar.
const oc1769 = fila({
  compraId: 1769,
  tipoDeConcepto: "Gasto",
  articuloGranTotalMxn: 22499.999211,
  articuloImporteConDescuentoMxn: 21617.3,
  articuloIVAMxn: 3458.768,
  articuloIVARetenidoMxn: 270.21625,
  articuloISRretenidoMxn: 2305.852539,
  facturaGranTotalMxn: 22500,
  facturaSaldoActual: 22500,
});

describe("resumenCompras", () => {
  it("Resultado = Σ del gran total de cada concepto, con su desglose", () => {
    const r = resumenCompras([...oc1703, oc1769]);
    expect(r.granTotal).toBeCloseTo(28050.599211, 6);
    expect(r.importeConDescuento).toBeCloseTo(26402.3, 4);
    expect(r.iva).toBeCloseTo(4224.368, 4);
    expect(r.ivaRetenido).toBeCloseTo(270.21625, 6);
    expect(r.isrRetenido).toBeCloseTo(2305.852539, 6);
    expect(granTotalCompras([...oc1703, oc1769])).toBe(r.granTotal);
  });

  it("separa el gran total por tipo de concepto", () => {
    const { porTipo } = resumenCompras([...oc1703, oc1769]);
    expect(porTipo.Stock).toBeCloseTo(5144.6, 4);
    expect(porTipo.Gasto).toBeCloseTo(22905.999211, 6);
  });

  it("total y saldo de la factura cuentan una vez por compra", () => {
    const r = resumenCompras([...oc1703, oc1769]);
    expect(r.facturasGranTotal).toBeCloseTo(28050.6, 4);
    expect(r.saldo).toBe(22500);
  });

  it("sin filas, todo en cero", () => {
    expect(resumenCompras([])).toEqual({
      granTotal: 0,
      importeConDescuento: 0,
      iva: 0,
      ivaRetenido: 0,
      isrRetenido: 0,
      porTipo: {},
      facturasGranTotal: 0,
      saldo: 0,
    });
  });
});
