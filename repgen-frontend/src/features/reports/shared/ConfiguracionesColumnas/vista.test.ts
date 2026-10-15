import { detectarPeriodo, huellaVista, resolverPeriodo } from "./vista";

describe("vista: periodos", () => {
  const hoy = new Date(2026, 9, 12); // 12 oct 2026, hora local

  it("resuelve cada periodo a fechas locales", () => {
    expect(resolverPeriodo("mes_actual", hoy)).toEqual({ desde: "2026-10-01", hasta: "2026-10-12" });
    expect(resolverPeriodo("mes_anterior", hoy)).toEqual({ desde: "2026-09-01", hasta: "2026-09-30" });
    expect(resolverPeriodo("anio_en_curso", hoy)).toEqual({ desde: "2026-01-01", hasta: "2026-10-12" });
  });

  it("en enero, 'mes anterior' es diciembre del año previo", () => {
    expect(resolverPeriodo("mes_anterior", new Date(2027, 0, 5))).toEqual({
      desde: "2026-12-01",
      hasta: "2026-12-31",
    });
  });

  it("detecta el periodo que corresponde a un rango, o null", () => {
    expect(detectarPeriodo({ desde: "2026-09-01", hasta: "2026-09-30" }, hoy)).toBe("mes_anterior");
    expect(detectarPeriodo({ desde: "2026-09-02", hasta: "2026-09-30" }, hoy)).toBeNull();
  });
});

describe("vista: huella", () => {
  it("ignora el ancho de las columnas", () => {
    expect(huellaVista([{ colId: "a", width: 100 }], null)).toBe(
      huellaVista([{ colId: "a", width: 320 }], null),
    );
  });

  it("detecta cambios de visibilidad, orden y filtros", () => {
    const base = huellaVista([{ colId: "a" }, { colId: "b" }], null);
    expect(huellaVista([{ colId: "a", hide: true }, { colId: "b" }], null)).not.toBe(base);
    expect(huellaVista([{ colId: "b" }, { colId: "a" }], null)).not.toBe(base);
    expect(huellaVista([{ colId: "a" }, { colId: "b" }], { a: { filter: "x" } })).not.toBe(base);
  });

  it("no depende del orden de las claves del filtro, y {} equivale a sin filtros", () => {
    expect(huellaVista([], { a: { type: "contains", filter: "x" } })).toBe(
      huellaVista([], { a: { filter: "x", type: "contains" } }),
    );
    expect(huellaVista([], {})).toBe(huellaVista([], null));
  });
});
