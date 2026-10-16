import { calcularTotalesVentas, cuentaEnNeto } from "./useTotalesVentas";

describe("calcularTotalesVentas", () => {
  it("facturas: el neto es lo facturado menos cancelaciones y devoluciones; otros negativos no restan", () => {
    const t = calcularTotalesVentas(
      [
        { facturaGranTotalMxn: 1000, facturaEstatus: "Pagada" },
        { facturaGranTotalMxn: 500, facturaEstatus: "Vigente" },
        { facturaGranTotalMxn: -200, facturaEstatus: "Cancelada" },
        { facturaGranTotalMxn: -100, facturaEstatus: "Devolución" },
        { facturaGranTotalMxn: -50, facturaEstatus: "Otro" },
      ],
      "facturas",
    );
    expect(t).toMatchObject({
      totalVentas: 1500,
      totalCancelaciones: -200,
      totalDevoluciones: -100,
      facturacionNeta: 1200,
      facturasPagadas: 1,
      facturasVigentes: 1,
      facturasCanceladas: 1,
      devoluciones: 1,
    });
  });

  it("conceptos: suma importe e impuestos por artículo, y ganancia y costo", () => {
    const t = calcularTotalesVentas(
      [
        {
          articuloImporteConDescuentoMxn: 100,
          articuloIVAMxn: 16,
          articuloIEPSMxn: 0,
          articuloIVARetenidoMxn: 0,
          articuloISRretenidoMxn: 0,
          gananciaBrutaMxn: 30,
          costoDirectoSubTotalMxn: 70,
        },
      ],
      "conceptos",
    );
    expect(t).toMatchObject({ totalVentas: 116, facturacionNeta: 116, gananciaBruta: 30, costoDirecto: 70 });
  });

  it("el pie suma las mismas filas que el neto: su Gran Total es la Facturación neta", () => {
    const facturas = [
      { facturaGranTotalMxn: 1000, facturaEstatus: "Pagada" },
      { facturaGranTotalMxn: -200, facturaEstatus: "Cancelada" },
      { facturaGranTotalMxn: -100, facturaEstatus: "Devolución" },
      { facturaGranTotalMxn: -50, facturaEstatus: "Otro" },
      { facturaGranTotalMxn: 0, facturaEstatus: "Vigente" },
    ];
    const pie = facturas
      .filter((f) => cuentaEnNeto(f, "facturas"))
      .reduce((s, f) => s + f.facturaGranTotalMxn, 0);
    expect(pie).toBe(calcularTotalesVentas(facturas, "facturas").facturacionNeta);

    const conceptos = [
      { articuloImporteConDescuentoMxn: 100, articuloIVAMxn: 16, articuloIEPSMxn: 0, articuloIVARetenidoMxn: 0, articuloISRretenidoMxn: 0, facturaEstatus: "Pagada" },
      { articuloImporteConDescuentoMxn: -40, articuloIVAMxn: -6.4, articuloIEPSMxn: 0, articuloIVARetenidoMxn: 0, articuloISRretenidoMxn: 0, facturaEstatus: "Cancelada" },
      { articuloImporteConDescuentoMxn: -10, articuloIVAMxn: -1.6, articuloIEPSMxn: 0, articuloIVARetenidoMxn: 0, articuloISRretenidoMxn: 0, facturaEstatus: "Otro" },
    ];
    const suma = conceptos
      .filter((f) => cuentaEnNeto(f, "conceptos"))
      .reduce((s, f) => s + f.articuloImporteConDescuentoMxn + f.articuloIVAMxn, 0);
    expect(suma).toBeCloseTo(calcularTotalesVentas(conceptos, "conceptos").facturacionNeta);
  });
});
