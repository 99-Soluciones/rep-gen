import { vi } from "vitest";
const obtenerReporteMock = vi.hoisted(() => vi.fn());

vi.mock("./api/reportes.api", () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { useComparacionPeriodo } from "./useComparacionPeriodo";

describe("useComparacionPeriodo", () => {
  it("«Actualizar datos» (un intento nuevo) vuelve a leer el periodo anterior", async () => {
    obtenerReporteMock.mockResolvedValueOnce([{ monto: 100 }]).mockResolvedValueOnce([{ monto: 250 }]);
    const props = {
      endpoint: "bancos/buscar",
      desde: "2026-10-01",
      hasta: "2026-10-31",
      calcular: (filas: { monto: number }[]) => filas.reduce((s, f) => s + f.monto, 0),
    };
    const { result, rerender } = renderHook((intento: number) => useComparacionPeriodo({ ...props, intento }), {
      initialProps: 0,
    });
    await waitFor(() => expect(result.current.valor).toBe(100));
    expect(result.current.rango).toEqual({ desde: "2026-09-01", hasta: "2026-09-30" });

    rerender(1);
    await waitFor(() => expect(result.current.valor).toBe(250));
    expect(obtenerReporteMock).toHaveBeenCalledTimes(2);
  });
});
