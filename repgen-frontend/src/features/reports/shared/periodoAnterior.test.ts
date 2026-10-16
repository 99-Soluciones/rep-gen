import { periodoAnterior } from "./periodoAnterior";

describe("periodoAnterior", () => {
  it.each([
    // Mes en curso: los mismos días del mes anterior.
    [{ desde: "2026-10-01", hasta: "2026-10-15" }, { desde: "2026-09-01", hasta: "2026-09-15" }],
    // Mes completo: el mes anterior completo, aunque tenga menos días.
    [{ desde: "2026-10-01", hasta: "2026-10-31" }, { desde: "2026-09-01", hasta: "2026-09-30" }],
    [{ desde: "2026-03-01", hasta: "2026-03-31" }, { desde: "2026-02-01", hasta: "2026-02-28" }],
    // El 30 de marzo no existe en febrero: el último día.
    [{ desde: "2026-03-01", hasta: "2026-03-30" }, { desde: "2026-02-01", hasta: "2026-02-28" }],
    // Enero compara con diciembre del año anterior.
    [{ desde: "2026-01-01", hasta: "2026-01-10" }, { desde: "2025-12-01", hasta: "2025-12-10" }],
    // Año en curso: el mismo tramo del año anterior.
    [{ desde: "2026-01-01", hasta: "2026-10-15" }, { desde: "2025-01-01", hasta: "2025-10-15" }],
    // Cualquier otro rango: los mismos días justo antes.
    [{ desde: "2026-10-05", hasta: "2026-10-11" }, { desde: "2026-09-28", hasta: "2026-10-04" }],
  ])("%o → %o", (rango, esperado) => {
    expect(periodoAnterior(rango)).toEqual(esperado);
  });
});
