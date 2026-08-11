import { vi } from "vitest";
import { act } from "react"
const obtenerReporteMock = vi.hoisted(() => vi.fn());

vi.mock("../api/reports-api", () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { useReporteBase } from "./useReporteBase";

describe("useReporteBase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerReporteMock.mockResolvedValue({
      datos: [],
      totalPaginas: 1,
      paginaActual: 1,
    });
  });

  it("solicita datos con parametros iniciales", async () => {
    obtenerReporteMock.mockResolvedValueOnce({
      datos: [{ id: 1 }],
      totalPaginas: 2,
      paginaActual: 1,
    });

    const { result } = renderHook(() =>
      useReporteBase<{ id: number }>({
        endpoint: "bancos/buscar",
        initialLimit: 100,
        initialBusqueda: "hola",
        initialFechaDesde: "2026-05-01",
        initialFechaHasta: "2026-05-31",
      }),
    );

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalled());

    expect(obtenerReporteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "bancos/buscar",
        pagina: 1,
        limite: 100,
        busquedaGlobal: "hola",
        modeloFiltros: {},
        rangoFechas: {
          fechaInicio: "2026-05-01",
          fechaFin: "2026-05-31",
        },
      }),
    );

    await waitFor(() =>
      expect(result.current.datos).toEqual([{ id: 1 }]),
    );
    expect(result.current.totalPaginas).toBe(2);
  });

  it("vuelve a solicitar cuando cambia la busqueda o pagina", async () => {
    const { result } = renderHook(() =>
      useReporteBase({
        endpoint: "ventas/buscar",
      }),
    );

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setBusquedaActiva("nuevo");
    });

    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ busquedaGlobal: "nuevo" }),
      ),
    );

    act(() => {
      result.current.setPaginaActual(3);
    });

    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ pagina: 3 }),
      ),
    );
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

  it("reinicia pagina, busqueda y filtros al cambiar el endpoint", async () => {
    const { result, rerender } = renderHook(
      ({ endpoint }: { endpoint: string }) => useReporteBase({ endpoint }),
      { initialProps: { endpoint: "ventas/buscar" } },
    );

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setBusquedaActiva("algo");
      result.current.setModeloFiltros({ estado: "ok" });
    });

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalledTimes(2));

    rerender({ endpoint: "ventas-por-concepto/buscar" });

    // Una sola solicitud nueva, ya con la búsqueda, filtros y página
    // reiniciados (sin valores obsoletos del endpoint anterior).
    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endpoint: "ventas-por-concepto/buscar",
          pagina: 1,
          busquedaGlobal: "",
          modeloFiltros: {},
        }),
      ),
    );
    expect(obtenerReporteMock).toHaveBeenCalledTimes(3);
  });

  it("no vuelve a solicitar cuando solo cambian los filtros locales, pero los reenvia al cambiar la fecha", async () => {
    const { result } = renderHook(() =>
      useReporteBase({
        endpoint: "ventas/buscar",
        initialFechaDesde: "2026-05-01",
        initialFechaHasta: "2026-05-31",
      }),
    );

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setModeloFiltros({ estado: "ok" });
    });

    // Los filtros de columna se aplican localmente en ag-grid; no deben
    // generar una nueva solicitud al servidor por sí solos.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(obtenerReporteMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setFechaDesde("2026-06-01");
      result.current.setFechaHasta("2026-06-30");
    });

    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          modeloFiltros: { estado: "ok" },
          rangoFechas: {
            fechaInicio: "2026-06-01",
            fechaFin: "2026-06-30",
          },
        }),
      ),
    );
    expect(obtenerReporteMock).toHaveBeenCalledTimes(2);
  });
});
