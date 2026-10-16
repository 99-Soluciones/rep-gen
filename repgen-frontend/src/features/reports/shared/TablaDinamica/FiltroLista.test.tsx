import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import FiltroLista from "./FiltroLista";

// El panel fuera del grid: AG Grid abre su popup solo con layout real (jsdom no lo
// tiene); aquí se prueba lo que muestra y el modelo que produce.
const filas = ["Pagada", "Pagada", "Cancelada", "Vigente", null];
const montar = (model: unknown = null) => {
  const onModelChange = vi.fn();
  const props = {
    model,
    onModelChange,
    onUiChange: vi.fn(),
    api: { forEachNode: (fn: (n: { data: unknown }) => void) => filas.forEach((v) => fn({ data: { v } })) },
    column: { getColDef: () => ({ headerName: "Factura Estatus" }), getColId: () => "facturaEstatus" },
    getValue: (nodo: { data: { v: unknown } }) => nodo.data.v,
  };
  render(<FiltroLista {...(props as unknown as Parameters<typeof FiltroLista>[0])} />);
  return onModelChange;
};

describe("FiltroLista", () => {
  it("lista cada valor con su cuenta, «(Vacío)» al final, y todo marcado sin filtro", () => {
    montar();
    expect(screen.getByRole("dialog", { name: "Filtrar Factura Estatus" })).toBeInTheDocument();
    const casillas = screen.getAllByRole("checkbox");
    expect(casillas.map((c) => c.closest("label")!.textContent)).toEqual([
      "Cancelada1",
      "Pagada2",
      "Vigente1",
      "(Vacío)1",
    ]);
    expect(casillas.every((c) => (c as HTMLInputElement).checked)).toBe(true);
  });

  it("desmarcar uno guarda «todo menos»; «Ninguno» con búsqueda solo afecta lo buscado", () => {
    const onModelChange = montar();
    fireEvent.click(screen.getByRole("checkbox", { name: /Pagada/ }));
    expect(onModelChange).toHaveBeenLastCalledWith({ filterType: "lista", modo: "excluir", valores: ["Pagada"] });

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar en Factura Estatus" }), {
      target: { value: "vig" },
    });
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Ninguno" }));
    expect(onModelChange).toHaveBeenLastCalledWith({ filterType: "lista", modo: "excluir", valores: ["Vigente"] });
  });

  it("un valor elegido que ya no tiene registros en el rango sigue a la vista", () => {
    montar({ filterType: "lista", modo: "incluir", valores: ["Pagada", "Devolución"] });
    const fuera = screen.getByRole("checkbox", { name: /Devolución/ });
    expect(fuera).toBeChecked();
    expect(fuera.closest("label")).toHaveTextContent("sin registros en este rango");
  });

  it("las flechas pasan de una casilla a otra", () => {
    montar();
    const [primera, segunda] = screen.getAllByRole("checkbox");
    primera.focus();
    fireEvent.keyDown(primera, { key: "ArrowDown" });
    expect(segunda).toHaveFocus();
  });
});
