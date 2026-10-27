import { describirCondicion } from "./describirFiltros";

describe("describirCondicion", () => {
  it("pone en palabras cada tipo de filtro", () => {
    expect(describirCondicion({ filterType: "text", type: "contains", filter: "BBVA" })).toBe(
      "contiene «BBVA»",
    );
    expect(describirCondicion({ filterType: "number", type: "greaterThan", filter: 5000 })).toBe(
      "mayor que 5,000",
    );
    expect(describirCondicion({ filterType: "number", type: "blank" })).toBe("vacío");
    expect(describirCondicion({ filterType: "number", type: "igualSinCentavos", filter: 5000 })).toBe(
      "igual a 5,000 (sin centavos)",
    );
    expect(describirCondicion({ filterType: "number", type: "igualSinCentavos", filter: 5000.5 })).toBe(
      "igual a 5,000.5",
    );
    expect(describirCondicion({ filterType: "number", type: "inRange", filter: 1000, filterTo: 5000 })).toBe(
      "entre 1,000 y 5,000",
    );
    expect(
      describirCondicion({
        filterType: "date",
        type: "inRange",
        dateFrom: "2026-09-01 00:00:00",
        dateTo: "2026-09-15 00:00:00",
      }),
    ).toBe("entre 01/09/2026 y 15/09/2026");
    // En fechas, como en el menú de la columna.
    expect(
      describirCondicion({ filterType: "date", type: "greaterThan", dateFrom: "2026-10-01 00:00:00" }),
    ).toBe("después de 01/10/2026");
  });

  it("une las condiciones de un filtro combinado", () => {
    expect(
      describirCondicion({
        filterType: "number",
        operator: "OR",
        conditions: [
          { filterType: "number", type: "lessThan", filter: 0 },
          { filterType: "number", type: "greaterThan", filter: 1000.5 },
        ],
      }),
    ).toBe("menor que 0 o mayor que 1,000.5");
  });

  it("pone en palabras los filtros de lista y lo que dice su botón", async () => {
    const { resumenLista } = await import("./describirFiltros");
    const incluir = { filterType: "lista" as const, modo: "incluir" as const, valores: ["BBVA", "Santander"] };
    const excluir = { filterType: "lista" as const, modo: "excluir" as const, valores: ["Cancelada"] };
    expect(describirCondicion(incluir)).toBe("es BBVA o Santander");
    expect(describirCondicion(excluir)).toBe("todo menos Cancelada");
    expect(describirCondicion({ filterType: "lista", modo: "incluir", valores: [""] })).toBe("es (Vacío)");
    expect(resumenLista(null)).toBe("Todos");
    expect(resumenLista(incluir)).toBe("BBVA, Santander");
    expect(resumenLista({ ...incluir, valores: ["A", "B", "C"] })).toBe("3 valores");
    expect(resumenLista(excluir)).toBe("Todo menos Cancelada");
    expect(resumenLista({ ...incluir, valores: [] })).toBe("Ninguno");
  });
});
