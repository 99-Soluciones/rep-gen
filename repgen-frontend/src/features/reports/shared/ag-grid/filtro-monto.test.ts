import { IGUAL_SIN_CENTAVOS, interpretarMonto, montoATexto } from "./filtro-monto";
import {
  filtroEntre,
  filtroIgualSinCentavos,
  filtroMayorOIgual,
  filtroMenorOIgual,
} from "./predicados-filtro";

describe("interpretarMonto", () => {
  it.each([
    ["5000", { type: IGUAL_SIN_CENTAVOS, filter: 5000 }],
    ["$5,000", { type: IGUAL_SIN_CENTAVOS, filter: 5000 }],
    ["=5000", { type: "equals", filter: 5000 }],
    [">5000", { type: "greaterThan", filter: 5000 }],
    ["> 5,000.50", { type: "greaterThan", filter: 5000.5 }],
    [">=1000", { type: "greaterThanOrEqual", filter: 1000 }],
    ["<0", { type: "lessThan", filter: 0 }],
    ["<=-10", { type: "lessThanOrEqual", filter: -10 }],
    ["-1200", { type: IGUAL_SIN_CENTAVOS, filter: -1200 }],
    ["1000-5000", { type: "inRange", filter: 1000, filterTo: 5000 }],
    ["1,000 - 5,000", { type: "inRange", filter: 1000, filterTo: 5000 }],
    ["5000-1000", { type: "inRange", filter: 1000, filterTo: 5000 }],
    ["-500-100", { type: "inRange", filter: -500, filterTo: 100 }],
  ])("«%s»", (texto, esperado) => {
    expect(interpretarMonto(texto)).toEqual(esperado);
  });

  it("vacío es sin filtro; lo que no es un monto es inválido", () => {
    expect(interpretarMonto("  ")).toBeNull();
    for (const texto of ["abc", ">", "5000-", "-", "1-2-3", ">=x"]) {
      expect(interpretarMonto(texto)).toBe("invalido");
    }
  });

  it("en porcentajes un número solo es «igual a» exacto", () => {
    expect(interpretarMonto("16", false)).toEqual({ type: "equals", filter: 16 });
  });
});

describe("montoATexto", () => {
  it("devuelve el modelo como se escribiría", () => {
    expect(montoATexto({ type: IGUAL_SIN_CENTAVOS, filter: 5000 })).toBe("5000");
    expect(montoATexto({ type: "greaterThanOrEqual", filter: 1000 })).toBe(">=1000");
    expect(montoATexto({ type: "inRange", filter: 1000, filterTo: 5000 })).toBe("1000-5000");
    // El "Igual a" de vistas guardadas antes es exacto: se escribe con "=".
    expect(montoATexto({ type: "equals", filter: 5000 })).toBe("=5000");
    expect(montoATexto({ type: "equals", filter: 16 }, false)).toBe("16");
    expect(montoATexto({ type: "blank" })).toBe("");
  });

  it("ida y vuelta: lo que se escribe vuelve igual", () => {
    for (const texto of ["5000", "=5000", ">5000", "<=0", "-1200", "1000-5000", "-500-100"]) {
      const condicion = interpretarMonto(texto);
      expect(condicion).not.toBe("invalido");
      expect(montoATexto(condicion as Exclude<typeof condicion, "invalido">)).toBe(texto);
    }
  });
});

describe("predicados de montos", () => {
  it("«Igual a» sin centavos: un entero cubre sus centavos; con decimales es exacto", () => {
    expect(filtroIgualSinCentavos([5000], 5000.99)).toBe(true);
    expect(filtroIgualSinCentavos([5000], 5001)).toBe(false);
    expect(filtroIgualSinCentavos([-1200], -1200.5)).toBe(true);
    expect(filtroIgualSinCentavos([5000.5], 5000.5)).toBe(true);
    expect(filtroIgualSinCentavos([5000.5], 5000.55)).toBe(false);
    expect(filtroIgualSinCentavos([0], null)).toBe(false);
  });

  it("los extremos cuentan y las celdas vacías no", () => {
    expect(filtroMayorOIgual([1000], 1000)).toBe(true);
    expect(filtroMenorOIgual([0], 0.001)).toBe(true); // en centavos, 0.001 es 0
    expect(filtroEntre([1000, 5000], 5000)).toBe(true);
    expect(filtroEntre([5000, 1000], 999.99)).toBe(false);
    expect(filtroEntre([0.1, 0.3], 0.1 + 0.2)).toBe(true);
    expect(filtroMayorOIgual([0], null)).toBe(false);
  });
});
