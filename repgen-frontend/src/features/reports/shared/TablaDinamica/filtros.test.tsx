import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const montar = async (filas: Record<string, unknown>[] = datos) => {
  const referenciaGrid = createRef<AgGridReact>();
  const onGridListo = vi.fn();
  const { container } = render(
    <TablaDinamica
      referenciaGrid={referenciaGrid}
      datos={filas}
      definicionesColumnas={columnas}
      estaCargando={false}
      onGridListo={onGridListo}
      filasVisibles={2}
    />,
  );
  await waitFor(() => expect(onGridListo).toHaveBeenCalled());
  const input = (placeholder: string) =>
    container.querySelector(`input[placeholder="${placeholder}…"]`) as HTMLInputElement;
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

  describe("montos escritos en el filtro flotante", () => {
    const montos = [
      { ventaId: 1, cliente: "A", facturaGranTotalMxn: 5000.4 },
      { ventaId: 2, cliente: "B", facturaGranTotalMxn: 5001 },
      { ventaId: 3, cliente: "C", facturaGranTotalMxn: -250 },
      { ventaId: 4, cliente: "D", facturaGranTotalMxn: 12000 },
      { ventaId: 5, cliente: "E", facturaGranTotalMxn: null },
    ];
    const escribir = (input: HTMLInputElement, texto: string) =>
      fireEvent.change(input, { target: { value: texto } });
    const ESPERA = { timeout: 3000 };

    it("un número ignora los centavos; operadores y rangos filtran", async () => {
      const { api, input } = await montar(montos);
      const total = input("Factura Gran Total (MXN)");

      escribir(total, "5000");
      await waitFor(() => expect(api.getDisplayedRowCount()).toBe(1), ESPERA);
      expect(api.getFilterModel().facturaGranTotalMxn).toMatchObject({ type: "igualSinCentavos", filter: 5000 });

      escribir(total, "<0");
      await waitFor(() => expect(api.getDisplayedRowCount()).toBe(1), ESPERA);

      escribir(total, "$5,000 - 13,000");
      await waitFor(() => expect(api.getDisplayedRowCount()).toBe(3), ESPERA);
      // Lo escrito se queda como el usuario lo escribió.
      expect(total.value).toBe("$5,000 - 13,000");
    });

    it("lo que no es un monto no filtra y se marca", async () => {
      const { api, input } = await montar(montos);
      const total = input("Factura Gran Total (MXN)");

      escribir(total, ">5000");
      await waitFor(() => expect(api.getDisplayedRowCount()).toBe(3), ESPERA);

      escribir(total, "abc");
      await waitFor(() => expect(total).toHaveAttribute("aria-invalid", "true"), ESPERA);
      expect(api.getDisplayedRowCount()).toBe(5);
      expect(total.value).toBe("abc");
      expect(document.getElementById(total.getAttribute("aria-describedby")!)).toHaveTextContent(
        "No es un monto. Escribe un monto, >5000 o 1000-5000.",
      );
    });

    it("un rango o un filtro de vista guardada se lee en el input; dos condiciones quedan de solo lectura", async () => {
      const { api, input, aplicar } = await montar(montos);
      const total = input("Factura Gran Total (MXN)");

      await aplicar({ facturaGranTotalMxn: { filterType: "number", type: "inRange", filter: 0, filterTo: 6000 } });
      await waitFor(() => expect(total.value).toBe("0-6000"));
      expect(api.getDisplayedRowCount()).toBe(2);

      // El "Igual a" de antes sigue exacto: 5000 no encuentra 5,000.40.
      await aplicar({ facturaGranTotalMxn: { filterType: "number", type: "equals", filter: 5000 } });
      await waitFor(() => expect(total.value).toBe("=5000"));
      expect(api.getDisplayedRowCount()).toBe(0);

      await aplicar({
        facturaGranTotalMxn: {
          filterType: "number",
          operator: "OR",
          conditions: [
            { filterType: "number", type: "lessThan", filter: 0 },
            { filterType: "number", type: "greaterThan", filter: 10000 },
          ],
        },
      });
      await waitFor(() => expect(total).toHaveAttribute("readonly"));
      expect(api.getDisplayedRowCount()).toBe(2);
    });
  });

  it("si los filtros excluyen todo, el aviso ofrece «Limpiar filtros»", async () => {
    const { api, aplicar } = await montar();
    await aplicar({ cliente: { filterType: "text", type: "contains", filter: "zzz" } });
    expect(api.getDisplayedRowCount()).toBe(0);

    const limpiar = await screen.findByRole("button", { name: "Limpiar filtros" });
    expect(screen.getByText("Ningún registro coincide con los filtros.")).toBeInTheDocument();
    fireEvent.click(limpiar);
    await waitFor(() => expect(api.getDisplayedRowCount()).toBe(2));
  });

  it("con el foco, el filtro de montos muestra qué se puede escribir; si no se entiende, lo dice", async () => {
    const { input } = await montar();
    const total = input("Factura Gran Total (MXN)");

    fireEvent.focus(total);
    expect(screen.getByText("Monto, >5000, <0 o 1000-5000")).toBeInTheDocument();

    fireEvent.change(total, { target: { value: "abc" } });
    await waitFor(
      () =>
        expect(
          screen.getAllByText("No es un monto. Escribe un monto, >5000 o 1000-5000.").length,
        ).toBeGreaterThan(0),
      { timeout: 3000 },
    );

    fireEvent.blur(total);
    expect(screen.queryByText("Monto, >5000, <0 o 1000-5000")).not.toBeInTheDocument();
  });

  describe("columnas de lista", () => {
    const columnasLista = construirColumnasVentas("factura").filter((c) =>
      ["ventaId", "facturaEstatus"].includes(c.colId!),
    ) as ColDef[];
    const filasLista = [
      { ventaId: 1, facturaEstatus: "Pagada" },
      { ventaId: 2, facturaEstatus: "Pagada" },
      { ventaId: 3, facturaEstatus: "Cancelada" },
      { ventaId: 4, facturaEstatus: "Vigente" },
      { ventaId: 5, facturaEstatus: null },
    ];

    const montarLista = async () => {
      const referenciaGrid = createRef<AgGridReact>();
      const onGridListo = vi.fn();
      render(
        <TablaDinamica
          referenciaGrid={referenciaGrid}
          datos={filasLista}
          definicionesColumnas={columnasLista}
          estaCargando={false}
          onGridListo={onGridListo}
          filasVisibles={5}
        />,
      );
      await waitFor(() => expect(onGridListo).toHaveBeenCalled());
      return referenciaGrid.current!.api;
    };

    it("filtra por los valores marcados y el botón bajo el encabezado lo dice", async () => {
      const api = await montarLista();
      await act(() => api.setFilterModel({ facturaEstatus: { filterType: "lista", modo: "excluir", valores: ["Cancelada"] } }));
      await waitFor(() => expect(api.getDisplayedRowCount()).toBe(4));
      expect(await screen.findByRole("button", { name: "Filtrar Factura Estatus: Todo menos Cancelada" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Limpiar filtro de Factura Estatus" }));
      await waitFor(() => expect(api.getDisplayedRowCount()).toBe(5));
      expect(screen.getByRole("button", { name: "Filtrar Factura Estatus: Todos" })).toBeInTheDocument();
    });
  });
});
