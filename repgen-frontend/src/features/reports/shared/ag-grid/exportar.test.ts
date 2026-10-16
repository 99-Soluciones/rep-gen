import { vi } from "vitest";
import type { RefObject } from "react";
import type { AgGridReact } from "ag-grid-react";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toastMock }));

import { exportarDatos } from "./exportar";

type ColDefPrueba = { field: string; headerName?: string; context?: { campoMoneda?: string } };
const columna = (colDef: ColDefPrueba) => ({ getColDef: () => colDef });

const gridCon = (registros: number, visibles: ColDefPrueba[], todas: ColDefPrueba[] = visibles) => {
  const exportDataAsCsv = vi.fn();
  const ref = {
    current: {
      api: {
        exportDataAsCsv,
        getDisplayedRowCount: () => registros,
        getAllDisplayedColumns: () => visibles.map(columna),
        getColumns: () => todas.map(columna),
      },
    },
  } as unknown as RefObject<AgGridReact | null>;
  return { ref, exportDataAsCsv };
};

describe("exportarDatos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("con un importe visible y su moneda oculta, agrega la moneda al archivo", () => {
    const importe = { field: "abono", context: { campoMoneda: "moneda" } };
    const moneda = { field: "moneda", headerName: "Moneda" };
    const { ref, exportDataAsCsv } = gridCon(3, [importe], [importe, moneda]);

    exportarDatos(ref, "r")({} as never);

    const columnas = exportDataAsCsv.mock.calls[0][0].columnKeys;
    expect(columnas.map((c: { getColDef: () => ColDefPrueba }) => c.getColDef().field)).toEqual([
      "abono",
      "moneda",
    ]);
    expect(toastMock.success).toHaveBeenCalledWith(
      "3 registros · 2 columnas (con Moneda, que estaba oculta), sin la fila de totales. Archivo: r.csv",
    );
  });

  it("sin registros no genera un archivo vacío", () => {
    const { ref, exportDataAsCsv } = gridCon(0, []);
    exportarDatos(ref, "r")({} as never);
    expect(exportDataAsCsv).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("exporta valores crudos sin la fila de totales y confirma cuántos registros", () => {
    const { ref, exportDataAsCsv } = gridCon(1234, [{ field: "abono" }]);

    exportarDatos(ref, "reporte_bancos_2026-09-01_a_2026-09-30")({} as never);

    const params = exportDataAsCsv.mock.calls[0][0];
    expect(params).toMatchObject({
      fileName: "reporte_bancos_2026-09-01_a_2026-09-30.csv",
      skipPinnedBottom: true,
    });
    // Excel recibe 1234.5, no "$1,234.50".
    expect(params.processCellCallback({ value: 1234.5 })).toBe(1234.5);
    expect(params.processCellCallback({ value: null })).toBe("");
    expect(toastMock.success).toHaveBeenCalledWith(
      "1,234 registros · 1 columna, sin la fila de totales. Archivo: reporte_bancos_2026-09-01_a_2026-09-30.csv",
    );
  });
});
