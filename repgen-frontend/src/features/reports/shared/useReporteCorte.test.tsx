import { vi } from "vitest";
import { act } from "react";
const obtenerReporteCorteMock = vi.hoisted(() => vi.fn());

vi.mock("./api/reportes.api", () => ({
  obtenerReporteCorte: (...args: unknown[]) => obtenerReporteCorteMock(...args),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { useReporteCorte } from "./useReporteCorte";
import { ApiError } from "../../../shared/api/http";

const montar = async () => {
  obtenerReporteCorteMock.mockResolvedValueOnce({ fechaCorte: "x", data: [{ id: 1 }] });
  const hook = renderHook(() => useReporteCorte<{ id: number }>({ endpoint: "cxc/buscar" }));
  await waitFor(() => expect(hook.result.current.datos).toEqual([{ id: 1 }]));
  return hook;
};

describe("useReporteCorte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerReporteCorteMock.mockResolvedValue({ fechaCorte: "x", data: [] });
  });

  it("sesión expirada: conserva los registros, vuelve al corte que los cargó y no consulta de nuevo", async () => {
    const { result } = await montar();
    const corteCargado = result.current.fechaCorte;

    obtenerReporteCorteMock.mockRejectedValueOnce(new ApiError(401, "Token inválido"));
    act(() => result.current.setFechaCorte("2024-06-10"));

    await waitFor(() => expect(obtenerReporteCorteMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.fechaCorte).toBe(corteCargado));
    expect(result.current.datos).toEqual([{ id: 1 }]);
    expect(result.current.error).toBeNull();
    await new Promise((r) => setTimeout(r, 20));
    expect(obtenerReporteCorteMock).toHaveBeenCalledTimes(2);
  });

  it("reintentar pide datos frescos; cambiar el corte no", async () => {
    const { result } = await montar();

    act(() => result.current.reintentar());
    await waitFor(() =>
      expect(obtenerReporteCorteMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ refrescar: true }),
      ),
    );

    act(() => result.current.setFechaCorte("2024-06-10"));
    await waitFor(() =>
      expect(obtenerReporteCorteMock).toHaveBeenLastCalledWith({
        endpoint: "cxc/buscar",
        fechaCorte: "2024-06-10",
      }),
    );
  });
});
