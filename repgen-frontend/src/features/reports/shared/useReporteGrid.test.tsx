import { vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { GridReadyEvent } from "ag-grid-community";
import type { ReportConfigResponse } from "./api/report-configs.api";

const configsMock = vi.hoisted(() => ({
  defaultConfig: null as ReportConfigResponse | null,
}));
vi.mock("./useReportConfigs", () => ({
  useReportConfigs: () => ({
    configs: [],
    defaultConfig: configsMock.defaultConfig,
    refresh: vi.fn(),
  }),
}));

import { useReporteGrid } from "./useReporteGrid";

const vista = (reportId: string): ReportConfigResponse => ({
  id: `cfg-${reportId}`,
  reportId,
  name: "Mi vista",
  columnState: [{ colId: "a", hide: true }],
  isDefault: true,
  createdAt: "",
  updatedAt: "",
});

const crearApi = () => ({
  applyColumnState: vi.fn(),
  getColumns: vi.fn(() => []),
  setFilterModel: vi.fn(),
  getDisplayedRowCount: vi.fn(() => 0),
});

describe("useReporteGrid", () => {
  beforeEach(() => {
    configsMock.defaultConfig = null;
  });

  it("aplica la vista predeterminada si ya cargó cuando el grid queda listo", () => {
    configsMock.defaultConfig = vista("bancos");
    const { result } = renderHook(() => useReporteGrid("bancos"));
    const api = crearApi();

    act(() => result.current.onGridListo({ api } as unknown as GridReadyEvent));

    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: "a", hide: true }],
      applyOrder: true,
    });
  });

  it("aplica la vista cuando llega después de que el grid está listo, una sola vez", () => {
    const { result, rerender } = renderHook(() => useReporteGrid("bancos"));
    const api = crearApi();
    act(() => {
      (result.current.referenciaGrid as { current: unknown }).current = { api };
      result.current.onGridListo({ api } as unknown as GridReadyEvent);
    });
    expect(api.applyColumnState).not.toHaveBeenCalled();

    configsMock.defaultConfig = vista("bancos");
    rerender();
    configsMock.defaultConfig = { ...vista("bancos") };
    rerender();

    expect(api.applyColumnState).toHaveBeenCalledTimes(1);
  });

  it("al cambiar de reporte limpia filtros y no aplica la vista del reporte anterior", () => {
    configsMock.defaultConfig = vista("ventas_facturas");
    const { result, rerender } = renderHook(
      ({ reportId }) => useReporteGrid(reportId),
      { initialProps: { reportId: "ventas_facturas" } },
    );
    const api = crearApi();
    act(() => {
      (result.current.referenciaGrid as { current: unknown }).current = { api };
      result.current.onGridListo({ api } as unknown as GridReadyEvent);
    });
    expect(api.applyColumnState).toHaveBeenCalledTimes(1);

    // Las vistas de "conceptos" aún no llegan: sigue la de facturas.
    rerender({ reportId: "ventas_conceptos" });
    expect(api.setFilterModel).toHaveBeenCalledWith(null);
    expect(api.applyColumnState).toHaveBeenCalledTimes(1);

    configsMock.defaultConfig = vista("ventas_conceptos");
    rerender({ reportId: "ventas_conceptos" });
    expect(api.applyColumnState).toHaveBeenCalledTimes(2);
  });
});
