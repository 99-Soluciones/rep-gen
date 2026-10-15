import { vi } from "vitest";
import { act } from "react";
const obtenerReporteMock = vi.hoisted(() => vi.fn());

vi.mock("./api/reportes.api", () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { describirErrorCarga, useReporteBase } from "./useReporteBase";
import { ApiError } from "../../../shared/api/http";
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

  it("al fallar vacía los datos del rango anterior y permite reintentar", async () => {
    obtenerReporteMock.mockResolvedValueOnce([{ id: 1 }]);
    const { result } = renderHook(() =>
      useReporteBase<{ id: number }>({ endpoint: "bancos/buscar" }),
    );
    await waitFor(() => expect(result.current.datos).toEqual([{ id: 1 }]));

    obtenerReporteMock.mockRejectedValueOnce(new ApiError(500, "FileMaker caído"));
    act(() => result.current.setFechaDesde("2026-06-01"));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.datos).toEqual([]);
    expect(result.current.error).toMatchObject({ reintentable: true });
    expect(result.current.error?.mensaje).not.toMatch(/500|FileMaker caído/);

    obtenerReporteMock.mockResolvedValueOnce([{ id: 2 }]);
    act(() => result.current.reintentar());

    await waitFor(() => expect(result.current.datos).toEqual([{ id: 2 }]));
    expect(result.current.error).toBeNull();
  });

  it("no ofrece reintentar cuando la sesión expiró", () => {
    expect(describirErrorCarga(new ApiError(401, "x"))).toMatchObject({ reintentable: false });
    expect(describirErrorCarga(new TypeError("Failed to fetch"))).toMatchObject({
      reintentable: true,
    });
  });

  describe("sesión expirada (401)", () => {
    it("conserva los registros, restaura el rango que los cargó y no vuelve a consultar", async () => {
      obtenerReporteMock.mockResolvedValueOnce([{ id: 1 }]);
      const { result } = renderHook(() =>
        useReporteBase<{ id: number }>({ endpoint: "bancos/buscar" }),
      );
      await waitFor(() => expect(result.current.datos).toEqual([{ id: 1 }]));
      const rangoCargado = [result.current.fechaDesde, result.current.fechaHasta];

      obtenerReporteMock.mockRejectedValueOnce(new ApiError(401, "Token inválido"));
      act(() => {
        result.current.setFechaDesde("2026-06-01");
        result.current.setFechaHasta("2026-06-30");
      });

      await waitFor(() => expect(result.current.estaCargando).toBe(false));
      await waitFor(() =>
        expect([result.current.fechaDesde, result.current.fechaHasta]).toEqual(rangoCargado),
      );
      expect(result.current.datos).toEqual([{ id: 1 }]);
      expect(result.current.error).toBeNull();
      // Restaurar el rango no dispara otra consulta (sería otro 401).
      await new Promise((r) => setTimeout(r, 20));
      expect(obtenerReporteMock).toHaveBeenCalledTimes(2);
    });

    it("en la primera carga muestra el error sin ofrecer reintentar", async () => {
      obtenerReporteMock.mockRejectedValueOnce(new ApiError(401, "Token inválido"));
      const { result } = renderHook(() => useReporteBase({ endpoint: "bancos/buscar" }));

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error).toMatchObject({ reintentable: false });
      expect(result.current.datos).toEqual([]);
    });

    it("vacía la tabla si los registros eran de otro reporte (cambio de pestaña)", async () => {
      obtenerReporteMock.mockResolvedValueOnce([{ id: 1 }]);
      const { result, rerender } = renderHook(
        ({ endpoint }: { endpoint: string }) => useReporteBase<{ id: number }>({ endpoint }),
        { initialProps: { endpoint: "ventas/buscar" } },
      );
      await waitFor(() => expect(result.current.datos).toEqual([{ id: 1 }]));

      obtenerReporteMock.mockRejectedValueOnce(new ApiError(401, "Token inválido"));
      rerender({ endpoint: "ventas-por-concepto/buscar" });

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.datos).toEqual([]);
    });
  });
});
