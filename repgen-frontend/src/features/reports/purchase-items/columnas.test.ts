import { construirColumnasComprasConceptos } from "./columnas";

const columnas = construirColumnasComprasConceptos();

describe("columnas de Compras por concepto", () => {
  it("la primera pantalla sigue el orden del reporte de FileMaker", () => {
    expect(columnas.slice(0, 8).map((c) => c.field)).toEqual([
      "compraFechaAprobado",
      "compraId",
      "proveedor",
      "facturaSerieFolio",
      "facturaEstatus",
      "articuloNombre",
      "tipoDeConcepto",
      "cantidad",
    ]);
  });

  it("18 columnas visibles; RFC, UUID, banco y categorías empiezan ocultas", () => {
    expect(columnas.filter((c) => !c.hide)).toHaveLength(18);
    const ocultas = columnas.filter((c) => c.hide).map((c) => c.field);
    expect(ocultas).toEqual(
      expect.arrayContaining(["proveedorRfc", "facturaUuid", "bancoNombre", "categoriadeProducto1"]),
    );
  });

  it("trae una columna por cada campo del contrato", () => {
    expect(columnas).toHaveLength(44);
  });

  it("las categorías usan el encabezado de Etiquetas de columnas", () => {
    const conEtiquetas = construirColumnasComprasConceptos((slot) =>
      slot === "articulo.categoria1" ? "Tipo De Venta" : undefined,
    );
    const categoria = (field: string) => conEtiquetas.find((c) => c.field === field)?.headerName;
    expect(categoria("categoriadeProducto1")).toBe("Tipo De Venta");
    expect(categoria("categoriadeProducto2")).toBe("Artículo Categoría 2");
  });
});
