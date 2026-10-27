import { desplazarRango } from "./desplazarRango";

const hoy = new Date(2026, 9, 16); // 16 oct 2026

describe("desplazarRango", () => {
  it("desde el mes en curso, ‹ da el mes anterior completo y › no existe", () => {
    expect(desplazarRango({ desde: "2026-10-01", hasta: "2026-10-16" }, -1, hoy)).toEqual({
      desde: "2026-09-01",
      hasta: "2026-09-30",
    });
    expect(desplazarRango({ desde: "2026-10-01", hasta: "2026-10-16" }, 1, hoy)).toBeNull();
  });

  it("entre meses completos; el mes en curso llega hasta hoy", () => {
    expect(desplazarRango({ desde: "2026-09-01", hasta: "2026-09-30" }, 1, hoy)).toEqual({
      desde: "2026-10-01",
      hasta: "2026-10-16",
    });
    expect(desplazarRango({ desde: "2026-03-01", hasta: "2026-03-31" }, -1, hoy)).toEqual({
      desde: "2026-02-01",
      hasta: "2026-02-28",
    });
    expect(desplazarRango({ desde: "2026-01-01", hasta: "2026-01-31" }, -1, hoy)).toEqual({
      desde: "2025-12-01",
      hasta: "2025-12-31",
    });
  });

  it("años: el año anterior completo; el siguiente no pasa de hoy", () => {
    expect(desplazarRango({ desde: "2026-01-01", hasta: "2026-10-16" }, -1, hoy)).toEqual({
      desde: "2025-01-01",
      hasta: "2025-12-31",
    });
    expect(desplazarRango({ desde: "2025-01-01", hasta: "2025-12-31" }, 1, hoy)).toEqual({
      desde: "2026-01-01",
      hasta: "2026-10-16",
    });
  });

  it("otro rango: los mismos días corridos, sin pasar de hoy", () => {
    expect(desplazarRango({ desde: "2026-10-05", hasta: "2026-10-11" }, -1, hoy)).toEqual({
      desde: "2026-09-28",
      hasta: "2026-10-04",
    });
    expect(desplazarRango({ desde: "2026-10-05", hasta: "2026-10-11" }, 1, hoy)).toEqual({
      desde: "2026-10-12",
      hasta: "2026-10-16",
    });
    expect(desplazarRango({ desde: "2026-10-12", hasta: "2026-10-16" }, 1, hoy)).toBeNull();
  });
});
