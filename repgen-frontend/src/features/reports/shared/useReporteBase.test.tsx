import { vi } from "vitest";
import { act } from "react";
const obtenerReporteMock = vi.hoisted(() => vi.fn());

vi.mock("./api/reportes.api", () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { useReporteBase } from "./useReporteBase";
import {
  obtenerFechaHoyFormateada,
  obtenerPrimerDiaDelMes,
} from "../../../shared/utils/fechas";

describe("useReporteBase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerReporteMock.mockResolvedValue([]);
  });

  it("solicita el mes en curso al montar y expone los datos", async () => {
    obtenerReporteMock.mockResolvedValueOnce([{ id: 1 }]);

    const { result } = renderHook(() =>
      useReporteBase<{ id: number }>({ endpoint: "bancos/buscar" }),
    );

    await waitFor(() => expect(result.current.datos).toEqual([{ id: 1 }]));
    expect(obtenerReporteMock).toHaveBeenCalledWith({
      endpoint: "bancos/buscar",
      rangoFechas: {
        fechaInicio: obtenerPrimerDiaDelMes(),
        fechaFin: obtenerFechaHoyFormateada(),
      },
    });
    expect(result.current.estaCargando).toBe(false);
  });

  it("vuelve a solicitar una sola vez cuando cambia el rango de fechas", async () => {
    const { result } = renderHook(() =>
      useReporteBase({ endpoint: "ventas/buscar" }),
    );

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setFechaDesde("2026-06-01");
      result.current.setFechaHasta("2026-06-30");
    });

    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenLastCalledWith({
        endpoint: "ventas/buscar",
        rangoFechas: { fechaInicio: "2026-06-01", fechaFin: "2026-06-30" },
      }),
    );
    expect(obtenerReporteMock).toHaveBeenCalledTimes(2);
  });

  it("vuelve a solicitar al cambiar el endpoint", async () => {
    const { rerender } = renderHook(
      ({ endpoint }: { endpoint: string }) => useReporteBase({ endpoint }),
      { initialProps: { endpoint: "ventas/buscar" } },
    );

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalledTimes(1));

    rerender({ endpoint: "ventas-por-concepto/buscar" });

    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ endpoint: "ventas-por-concepto/buscar" }),
      ),
    );
    expect(obtenerReporteMock).toHaveBeenCalledTimes(2);
  });

  it("invoca onError cuando falla la solicitud", async () => {
    const onError = vi.fn();
    obtenerReporteMock.mockRejectedValueOnce(new Error("fallo"));

    renderHook(() =>
      useReporteBase({
        endpoint: "ventas/buscar",
        onError,
      }),
    );

    await waitFor(() => expect(onError).toHaveBeenCalled());
  });
});
