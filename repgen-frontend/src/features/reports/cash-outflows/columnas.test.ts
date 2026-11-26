import { construirColumnasEgresos } from "./columnas";

const campos = (detalle: "factura" | "concepto") =>
  construirColumnasEgresos(detalle).map((c) => c.field);

describe("columnas de Flujo de efectivo - Egresos", () => {
  it("la primera pantalla dice qué salió, cuándo, de qué banco y a qué compra", () => {
    expect(campos("factura").slice(0, 8)).toEqual([
      "tipoRenglon",
      "pagoFecha",
      "bancoNombre",
      "bancoFolioTransaccion",
      "proveedor",
      "compraId",
      "facturaSerieFolio",
      "pagoGranTotalMxn",
    ]);
  });

  it("la vista por concepto agrega artículo y bodega; la de factura no los trae", () => {
    const factura = campos("factura");
    const concepto = campos("concepto");
    for (const campo of ["articuloSku", "cantidad", "unidadDeCompra", "bodegaEntregaEstatus"]) {
      expect(factura).not.toContain(campo);
    }
    expect(concepto).toEqual(
      expect.arrayContaining([...factura, "articuloSku", "cantidad", "unidadDeCompra", "bodegaEntregaEstatus"]),
    );
  });

  it("los datos técnicos empiezan ocultos", () => {
    const ocultas = construirColumnasEgresos("factura")
      .filter((c) => c.hide)
      .map((c) => c.field);
    expect(ocultas).toEqual(["proveedorRfc", "proveedorCuentaContable", "facturaObservaciones", "facturaUuid"]);
  });

  it("las categorías del artículo toman su encabezado del tenant", () => {
    const columnas = construirColumnasEgresos("concepto", (slot) =>
      slot === "articulo.categoria1" ? "Línea" : undefined,
    );
    expect(columnas.find((c) => c.field === "categoriadeProducto1")?.headerName).toBe("Línea");
    expect(columnas.find((c) => c.field === "categoriadeProducto2")?.headerName).toBe("Artículo Categoría 2");
  });
});
