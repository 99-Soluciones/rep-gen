import type { GridApi } from "ag-grid-community";
import { CLAVE_NOTA_TOTALES, calcularFilaTotales } from "./totales";

interface Fila {
  concepto: string;
  abono: number | null;
  cargo: number;
  moneda: string;
}

// API mínima: solo lo que usa calcularFilaTotales.
const apiCon = (filas: Fila[], primerCampo: string) =>
  ({
    forEachNodeAfterFilter: (cb: (nodo: { data: Fila }) => void) =>
      filas.forEach((data) => cb({ data })),
    getAllDisplayedColumns: () => [{ getColDef: () => ({ field: primerCampo }) }],
  }) as unknown as GridApi;

const filas: Fila[] = [
  { concepto: "a", abono: 100, cargo: 10, moneda: "MXN" },
  { concepto: "b", abono: null, cargo: 5.5, moneda: "MXN" },
  { concepto: "c", abono: 999, cargo: 999, moneda: "USD" },
];

describe("calcularFilaTotales", () => {
  it("suma solo los campos y filas indicados, con la etiqueta en la primera columna", () => {
    const fila = calcularFilaTotales(apiCon(filas, "concepto"), {
      campos: ["abono", "cargo"],
      incluirFila: (f: Fila) => f.moneda === "MXN",
      etiqueta: "Total MXN",
    });
    expect(fila).toEqual({ abono: 100, cargo: 15.5, concepto: "Total MXN" });
  });

  it("sin etiqueta no escribe nada en la primera columna (es un dato, no un rótulo)", () => {
    const fila = calcularFilaTotales(apiCon(filas, "concepto"), { campos: ["cargo"] });
    expect(fila).toEqual({ cargo: 1014.5 });
  });

  it("no pisa una suma con la etiqueta si la primera columna es sumable", () => {
    const fila = calcularFilaTotales(apiCon(filas, "abono"), { campos: ["abono"], etiqueta: "Total" });
    expect(fila).toEqual({ abono: 1099 });
  });

  it("la nota viaja con la etiqueta, fuera de las columnas", () => {
    const fila = calcularFilaTotales(apiCon(filas, "concepto"), {
      campos: ["cargo"],
      etiqueta: "Suma MXN",
      nota: "No es la facturación neta",
    });
    expect(fila).toEqual({
      cargo: 1014.5,
      concepto: "Suma MXN",
      [CLAVE_NOTA_TOTALES]: "No es la facturación neta",
    });
  });
});
