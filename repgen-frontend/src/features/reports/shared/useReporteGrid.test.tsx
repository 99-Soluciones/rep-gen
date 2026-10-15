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
  addEventListener: vi.fn(),
  getColumnState: vi.fn(() => []),
  getFilterModel: vi.fn(() => ({})),
  isDestroyed: () => false,
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

  it("al volver a una pestaña recupera sus columnas y filtros, sin reaplicar la predeterminada", () => {
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

    // El usuario filtra en Facturas.
    const filtroFacturas = { cliente: { filterType: "text", filter: "ACME" } };
    api.getFilterModel.mockReturnValue(filtroFacturas);
    api.getColumnState.mockReturnValue([{ colId: "cliente", hide: false }] as never);
    api.getColumns.mockReturnValue([{ getColId: () => "cliente" }] as never);
    act(() => result.current.onCambioVista());

    rerender({ reportId: "ventas_conceptos" });
    expect(api.setFilterModel).toHaveBeenLastCalledWith(null);

    api.setFilterModel.mockClear();
    api.applyColumnState.mockClear();
    configsMock.defaultConfig = vista("ventas_facturas");
    rerender({ reportId: "ventas_facturas" });

    expect(api.setFilterModel).toHaveBeenCalledWith(filtroFacturas);
    // Solo la restauración de lo que dejó el usuario, no la vista predeterminada.
    expect(api.applyColumnState).toHaveBeenCalledTimes(1);
    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: "cliente", hide: false }],
      applyOrder: true,
    });
  });
});
