import { formatearFecha, formatearMoneda } from "./formato";

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

describe("formatearMoneda por moneda del renglón", () => {
  it("usa $ para MXN o sin moneda, y el código para otras monedas", () => {
    expect(formatearMoneda(1000)).toBe("$1,000.00");
    expect(formatearMoneda(1000, "MXN")).toBe("$1,000.00");
    // Nunca debe parecer un monto en pesos.
    expect(formatearMoneda(1000, "usd")).toMatch(/^USD\s1,000\.00$/);
    expect(formatearMoneda(-250.5, "EUR")).toMatch(/^-EUR\s250\.50$/);
  });

  it("si la moneda no es un código válido, la muestra tal cual junto al número", () => {
    expect(formatearMoneda(1000, "Dólares")).toBe("1,000.00 Dólares");
  });

  it("una celda vacía o un texto sin dígitos no se vuelve $0.00", () => {
    expect(formatearMoneda("")).toBe("");
    // La etiqueta de la fila de totales se muestra tal cual.
    expect(formatearMoneda("Total MXN")).toBe("Total MXN");
    expect(formatearMoneda("0")).toBe("$0.00");
  });
});
