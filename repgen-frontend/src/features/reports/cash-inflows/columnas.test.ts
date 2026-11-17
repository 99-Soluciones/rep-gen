import { construirColumnasIngresos } from "./columnas";

const campos = (detalle: "factura" | "concepto") =>
  construirColumnasIngresos(detalle).map((c) => c.field);

describe("columnas de Flujo de efectivo - Ingresos", () => {
  it("la primera pantalla dice qué entró, cuándo, a qué banco y a qué factura", () => {
    expect(campos("factura").slice(0, 7)).toEqual([
      "tipoRenglon",
      "pagoFecha",
      "bancoNombre",
      "bancoFolioTransaccion",
      "cliente",
      "facturaSerieFolio",
      "pagoGranTotalMxn",
    ]);
  });

  it("la vista por concepto agrega las columnas del artículo; la de factura no las trae", () => {
    const factura = campos("factura");
    const concepto = campos("concepto");
    expect(factura).not.toContain("articuloSku");
    expect(factura).not.toContain("cantidad");
    expect(concepto).toEqual(expect.arrayContaining([...factura, "articuloSku", "cantidad", "metodoDeAdquisicion"]));
  });

  it("los datos técnicos empiezan ocultos", () => {
    const ocultas = construirColumnasIngresos("factura")
      .filter((c) => c.hide)
      .map((c) => c.field);
    expect(ocultas).toEqual([
      "clienteRfc",
      "clienteCuentaContable",
      "clienteColonia",
      "clienteDelegacion",
      "clienteCiudad",
      "clienteEstado",
      "clienteId",
      "bodegaId",
      "facturaUuid",
      "ventaId",
    ]);
  });

  it("las clasificaciones toman su encabezado del tenant", () => {
    const columnas = construirColumnasIngresos("concepto", (slot) =>
      slot === "cliente.clasificacion1" ? "Canal" : undefined,
    );
    expect(columnas.find((c) => c.field === "clasificacion1")?.headerName).toBe("Canal");
    expect(columnas.find((c) => c.field === "clasificacion2")?.headerName).toBe("Clasificación 2");
  });
});
