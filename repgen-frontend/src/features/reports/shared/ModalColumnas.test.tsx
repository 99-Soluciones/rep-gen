import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { type RefObject } from "react";
import ModalColumnas from "./ModalColumnas";
import type { Column } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";

vi.mock("ag-grid-react", () => ({
  AgGridReact: () => null,
}));

describe("ModalColumnas", () => {
  const setColumnasVisibles = vi.fn();
  const onCerrar = vi.fn();
  const columnA = {
    getColId: () => "idA",
    isVisible: () => true,
    getPinned: () => null,
    getColDef: () => ({ headerName: "Columna A" }),
  } as Column;
  const columnB = {
    getColId: () => "idB",
    isVisible: () => false,
    getPinned: () => "left",
    getColDef: () => ({ headerName: "Columna B" }),
  } as Column;
  const referenciaGrid = {
    current: {
      api: {
        setColumnsVisible: vi.fn(),
        getColumns: vi.fn(() => [columnA, columnB]),
        applyColumnState: vi.fn(),
      },
    },
  } as unknown as RefObject<AgGridReact<unknown> | null>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no renderiza nada cuando está cerrado", () => {
    const { container } = render(
      <ModalColumnas
        abierto={false}
        onCerrar={onCerrar}
        columnasVisibles={[columnA, columnB]}
        setColumnasVisibles={setColumnasVisibles}
        referenciaGrid={referenciaGrid}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("permite cambiar columnas y aplicar cambios", async () => {
    render(
      <ModalColumnas
        abierto
        onCerrar={onCerrar}
        columnasVisibles={[columnA, columnB]}
        setColumnasVisibles={setColumnasVisibles}
        referenciaGrid={referenciaGrid}
      />,
    );

    // Header text may be split across elements; assert modal content via actionable controls
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ocultar todas"));
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    // Sin columnas la tabla quedaría vacía: no se puede aplicar.
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
    expect(screen.getByText("Deja al menos una columna visible.")).toBeInTheDocument();

    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByText("Aplicar"));

    await waitFor(() => {
      expect(referenciaGrid.current?.api.applyColumnState).toHaveBeenCalledWith({
        state: [
          { colId: "idA", hide: true, pinned: null },
          { colId: "idB", hide: false, pinned: "left" },
        ],
        applyOrder: false,
      });
      expect(setColumnasVisibles).toHaveBeenCalledWith([columnA, columnB]);
      expect(onCerrar).toHaveBeenCalled();
    });
  });

  it("es un diálogo con nombre y avisa el cierre por Escape (evento close)", () => {
    render(
      <ModalColumnas
        abierto
        onCerrar={onCerrar}
        columnasVisibles={[columnA, columnB]}
        setColumnasVisibles={setColumnasVisibles}
        referenciaGrid={referenciaGrid}
      />,
    );

    const dialogo = screen.getByRole("dialog", { name: "Columnas visibles" });
    // Escape en un <dialog> modal dispara "close"; jsdom no lo emula con teclas.
    fireEvent(dialogo, new Event("close"));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("con búsqueda activa, ocultar actúa solo sobre las columnas encontradas", () => {
    render(
      <ModalColumnas
        abierto
        onCerrar={onCerrar}
        columnasVisibles={[columnA, columnB]}
        setColumnasVisibles={setColumnasVisibles}
        referenciaGrid={referenciaGrid}
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar columnas"), { target: { value: "B" } });
    fireEvent.click(screen.getByText("Ocultar la encontrada"));
    fireEvent.click(screen.getByText("Aplicar"));

    // Columna A estaba visible y no coincidía con la búsqueda: debe seguir visible.
    const api = referenciaGrid.current!.api as unknown as { applyColumnState: ReturnType<typeof vi.fn> };
    expect(api.applyColumnState).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.arrayContaining([
          { colId: "idA", hide: false, pinned: null },
          { colId: "idB", hide: true, pinned: "left" },
        ]),
      }),
    );
  });

  it("fija y suelta columnas a la izquierda", () => {
    render(
      <ModalColumnas
        abierto
        onCerrar={onCerrar}
        columnasVisibles={[columnA, columnB]}
        setColumnasVisibles={setColumnasVisibles}
        referenciaGrid={referenciaGrid}
      />,
    );

    const fijarA = screen.getByRole("button", { name: "Fijar «Columna A» a la izquierda" });
    const fijarB = screen.getByRole("button", { name: "Fijar «Columna B» a la izquierda" });
    expect(fijarA).toHaveAttribute("aria-pressed", "false");
    expect(fijarB).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(fijarA);
    fireEvent.click(fijarB);
    fireEvent.click(screen.getByText("Aplicar"));

    const api = referenciaGrid.current!.api as unknown as { applyColumnState: ReturnType<typeof vi.fn> };
    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [
        { colId: "idA", hide: false, pinned: "left" },
        { colId: "idB", hide: true, pinned: null },
      ],
      applyOrder: false,
    });
  });
});
