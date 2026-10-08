import { render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { vi } from "vitest";
import type { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import TablaDinamica from "./TablaDinamica";
import { columnasBancos } from "../../banks/columnas";
import { construirColumnasVentas } from "../../sales/columnas";

// AG Grid real (sin mock): con ValidationModule activo en desarrollo, cualquier
// módulo que falte en el registro de TablaDinamica se reporta por consola.
describe("TablaDinamica con AG Grid real", () => {
  it.each<[string, ColDef[]]>([
    ["bancos", columnasBancos as ColDef[]],
    ["ventas por factura", construirColumnasVentas("factura") as ColDef[]],
    ["ventas por concepto", construirColumnasVentas("conceptos") as ColDef[]],
  ])("tiene registrados los módulos que usa el reporte de %s", async (_, columnas) => {
    const avisosAgGrid: string[] = [];
    const capturar = (...args: unknown[]) => {
      const texto = args.map(String).join(" ");
      if (texto.includes("AG Grid")) avisosAgGrid.push(texto);
    };
    vi.spyOn(console, "error").mockImplementation(capturar);
    vi.spyOn(console, "warn").mockImplementation(capturar);

    const referenciaGrid = createRef<AgGridReact>();
    const onGridListo = vi.fn();
    const [texto, numero, fecha] = ["text", "number", "date"].map(
      (tipo) =>
        columnas.find((c) =>
          tipo === "text"
            ? !c.filter || c.filter === true
            : c.filter === (tipo === "number" ? "agNumberColumnFilter" : "agDateColumnFilter"),
        )?.colId,
    );

    const { container } = render(
      <TablaDinamica
        referenciaGrid={referenciaGrid}
        datos={[{ [texto ?? "x"]: "abc", [numero ?? "n"]: 10, [fecha ?? "f"]: "2026-10-01" }]}
        definicionesColumnas={columnas}
        estaCargando={false}
        onGridListo={onGridListo}
        filasVisibles={1}
      />,
    );
    await waitFor(() => expect(onGridListo).toHaveBeenCalled());
    // El filtro flotante propio (FloatingFilterConLimpiar) se renderiza en el header.
    await waitFor(() =>
      expect(container.querySelector(".ag-floating-filter-input input.pr-7")).not.toBeNull(),
    );

    // Las mismas APIs que llaman las pantallas de reporte.
    const api = referenciaGrid.current!.api;
    api.applyColumnState({ state: [{ colId: texto!, sort: "asc" }] });
    api.applyColumnState({ state: api.getColumnState(), applyOrder: true });
    api.getColumns();
    api.setFilterModel({
      [texto!]: { filterType: "text", type: "contains", filter: "a" },
      ...(numero && { [numero]: { filterType: "number", type: "greaterThan", filter: 1 } }),
      ...(fecha && { [fecha]: { filterType: "date", type: "equals", dateFrom: "2026-10-01" } }),
    });
    api.forEachNodeAfterFilter(() => {});
    api.forEachNodeAfterFilterAndSort(() => {});
    api.getDisplayedRowCount();
    api.setFilterModel(null);
    api.sizeColumnsToFit();
    // Misma ruta que exportDataAsCsv sin disparar la descarga (no existe en jsdom).
    expect(typeof api.getDataAsCsv()).toBe("string");

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(avisosAgGrid).toEqual([]);
  });
});
