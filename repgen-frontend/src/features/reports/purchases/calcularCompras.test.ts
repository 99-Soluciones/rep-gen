import type { ReportPurchaseRecord } from "@repgen/shared-types";
import { granTotalComprasGeneral, resumenComprasGeneral } from "./calcularCompras";

const compra = (valores: Partial<ReportPurchaseRecord>) =>
  ({
    facturaEstatus: "Liquidado",
    facturaGranTotalMxn: null,
    importeConDescuentoMxn: null,
    ivaMxn: null,
    ivaRetenidoMxn: null,
    isrRetenidoMxn: null,
    facturaSaldoActual: null,
    ...valores,
  }) as ReportPurchaseRecord;

// De los datos dorados: 1703 liquidada, 1769 vencida con retenciones, 1749 vigente.
const filas = [
  compra({ compraId: 1703, facturaGranTotalMxn: 5550.6, importeConDescuentoMxn: 4785, ivaMxn: 765.6, facturaSaldoActual: 0 }),
  compra({
    compraId: 1769,
    facturaEstatus: "Vencida",
    facturaGranTotalMxn: 22500,
    importeConDescuentoMxn: 21617.3,
    ivaMxn: 3458.768,
    ivaRetenidoMxn: 270.21625,
    isrRetenidoMxn: 2305.852539,
    facturaSaldoActual: 22500,
  }),
  compra({ compraId: 1749, facturaEstatus: "Vigente", facturaGranTotalMxn: 20945.5, importeConDescuentoMxn: 20945.5, facturaSaldoActual: 20945.5 }),
];

describe("resumenComprasGeneral", () => {
  it("Resultado = Σ del gran total de las compras, con su desglose", () => {
    const r = resumenComprasGeneral(filas);
    expect(r.granTotal).toBeCloseTo(48996.1, 6);
    expect(r.importeConDescuento).toBeCloseTo(47347.8, 6);
    expect(r.iva).toBeCloseTo(4224.368, 6);
    expect(r.ivaRetenido).toBeCloseTo(270.21625, 6);
    expect(r.isrRetenido).toBeCloseTo(2305.852539, 6);
    expect(granTotalComprasGeneral(filas)).toBe(r.granTotal);
  });

  it("saldo por pagar y compras por estatus", () => {
    const { saldo, porEstatus } = resumenComprasGeneral(filas);
    expect(saldo).toBeCloseTo(43445.5, 6);
    expect(porEstatus).toEqual({
      Liquidado: { compras: 1, saldo: 0 },
      Vencida: { compras: 1, saldo: 22500 },
      Vigente: { compras: 1, saldo: 20945.5 },
    });
  });

  it("sin filas, todo en cero", () => {
    const r = resumenComprasGeneral([]);
    expect([r.granTotal, r.saldo, r.porEstatus.Vencida.compras]).toEqual([0, 0, 0]);
  });
});
