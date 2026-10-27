import type { CellClassParams } from "ag-grid-community";
import { ColumnBuilder } from "./construir-columnas";

const columnas = new ColumnBuilder<"default">({
  columns: {
    folio: { field: "folio", dataType: "text" },
    importe: { field: "importe", dataType: "currency" },
  },
  reportTypes: { default: ["folio", "importe"] },
}).construirColumnas("default");

const clases = (indice: number, value: unknown, rowPinned?: "bottom") =>
  Object.entries(columnas[indice].cellClassRules ?? {})
    .filter(([, regla]) =>
      typeof regla === "function" && regla({ value, node: { rowPinned } } as CellClassParams),
    )
    .map(([clase]) => clase);

describe("clases de celda", () => {
  it("pinta en rojo solo las cifras negativas", () => {
    expect(clases(1, -250.5)).toEqual(["cifra-negativa"]);
    expect(clases(1, 0)).toEqual([]);
    expect(clases(1, "-0")).toEqual([]);
    // Un folio con guion no es una cifra que reste.
    expect(clases(0, "-12")).toEqual([]);
  });

  it("marca el rótulo de la fila de totales, en cualquier tipo de columna", () => {
    expect(clases(0, "Total MXN", "bottom")).toEqual(["rotulo-total"]);
    expect(clases(0, "Total MXN")).toEqual([]);
    expect(clases(1, -10, "bottom")).toEqual(["cifra-negativa"]);
  });
});
