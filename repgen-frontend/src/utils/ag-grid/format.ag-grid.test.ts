import { formatearFecha } from "./format.ag-grid";

describe("formatearFecha", () => {
  it("muestra una fecha ISO (YYYY-MM-DD) en el mismo día local, sin desfase por UTC", () => {
    expect(formatearFecha("2026-10-01")).toBe(
      new Date(2026, 9, 1).toLocaleDateString("es-MX"),
    );
  });

  it("sigue aceptando el formato de FileMaker (MM/DD/YYYY)", () => {
    expect(formatearFecha("10/01/2026")).toBe(
      new Date(2026, 9, 1).toLocaleDateString("es-MX"),
    );
  });

  it("devuelve el texto original si no es una fecha", () => {
    expect(formatearFecha("sin fecha")).toBe("sin fecha");
  });
});
