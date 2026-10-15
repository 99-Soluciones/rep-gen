import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { vi } from "vitest";
import type { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import TablaDinamica from "./TablaDinamica";
import { construirColumnasVentas } from "../../sales/columnas";

// Filtros de columna con AG Grid real: predicados de ag-grid/predicados-filtro y el
// filtro flotante propio (FloatingFilterConLimpiar).
const columnas = construirColumnasVentas("factura").filter((c) =>
  ["ventaId", "cliente", "facturaGranTotalMxn"].includes(c.colId!),
) as ColDef[];
const datos = [
  { ventaId: 11, cliente: "Árbol SA", facturaGranTotalMxn: 100 },
  { ventaId: 10, cliente: "Otro", facturaGranTotalMxn: null },
];

const montar = async () => {
  const referenciaGrid = createRef<AgGridReact>();
  const onGridListo = vi.fn();
  const { container } = render(
    <TablaDinamica
      referenciaGrid={referenciaGrid}
      datos={datos}
      definicionesColumnas={columnas}
      estaCargando={false}
      onGridListo={onGridListo}
      filasVisibles={2}
    />,
  );
  await waitFor(() => expect(onGridListo).toHaveBeenCalled());
  const input = (placeholder: string) =>
    container.querySelector(`input[placeholder="${placeholder}..."]`) as HTMLInputElement;
  await waitFor(() => expect(input("Venta ID")).not.toBeNull());
  const api = referenciaGrid.current!.api;
  const aplicar = (modelo: Record<string, unknown> | null) =>
    act(() => api.setFilterModel(modelo));
  return { api, input, aplicar };
};

describe("filtros de columna", () => {
  it("el filtro flotante refleja el modelo puesto por API y se limpia con setFilterModel(null)", async () => {
    const { input, aplicar } = await montar();

    await aplicar({ cliente: { filterType: "text", type: "contains", filter: "arb" } });
    await waitFor(() => expect(input("Cliente").value).toBe("arb"));

    await aplicar(null);
    await waitFor(() => expect(input("Cliente").value).toBe(""));
  });

  it("escribir en el filtro flotante filtra las filas", async () => {
    const { api, input } = await montar();

    fireEvent.change(input("Cliente"), { target: { value: "otro" } });

    await waitFor(() => expect(api.getDisplayedRowCount()).toBe(1), { timeout: 2000 });
    expect(input("Cliente").value).toBe("otro");
  });

  it("'Igual a' de texto coincide con celdas numéricas e ignora mayúsculas y acentos", async () => {
    const { api, aplicar } = await montar();

    await aplicar({ ventaId: { filterType: "text", type: "equals", filter: "11" } });
    expect(api.getDisplayedRowCount()).toBe(1);

    await aplicar({ cliente: { filterType: "text", type: "equals", filter: "ARBOL sa" } });
    expect(api.getDisplayedRowCount()).toBe(1);
  });

  it("'Mayor que' / 'Menor que' excluyen las celdas vacías", async () => {
    const { api, aplicar } = await montar();

    await aplicar({ facturaGranTotalMxn: { filterType: "number", type: "lessThan", filter: 500 } });
    expect(api.getDisplayedRowCount()).toBe(1);

    await aplicar({ facturaGranTotalMxn: { filterType: "number", type: "greaterThan", filter: 50 } });
    expect(api.getDisplayedRowCount()).toBe(1);
  });
});
