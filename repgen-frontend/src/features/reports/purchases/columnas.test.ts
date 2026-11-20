import { columnasCompras } from "./columnas";

describe("columnas de Compras", () => {
  it("la primera pantalla: la compra, su factura y sus montos", () => {
    expect(columnasCompras.slice(0, 7).map((c) => c.field)).toEqual([
      "compraFechaAprobado",
      "compraId",
      "proveedor",
      "facturaSerieFolio",
      "facturaFecha",
      "facturaEstatus",
      "importeConDescuentoMxn",
    ]);
  });

  it("16 columnas visibles; RFC, UUID y moneda empiezan ocultas", () => {
    expect(columnasCompras.filter((c) => !c.hide)).toHaveLength(16);
    expect(columnasCompras.filter((c) => c.hide).map((c) => c.field)).toEqual(
      expect.arrayContaining(["proveedorRfc", "facturaUuid", "facturaMoneda"]),
    );
  });

  it("trae una columna por cada campo del contrato", () => {
    expect(columnasCompras).toHaveLength(28);
  });
});
