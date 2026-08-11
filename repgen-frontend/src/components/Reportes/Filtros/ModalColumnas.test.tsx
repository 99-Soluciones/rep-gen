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
    getColDef: () => ({ headerName: "Columna A" }),
  } as Column;
  const columnB = {
    getColId: () => "idB",
    isVisible: () => false,
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
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ocultar Todas"));
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);

    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(referenciaGrid.current?.api.applyColumnState).toHaveBeenCalledWith({
        state: [
          { colId: "idA", hide: true },
          { colId: "idB", hide: true },
        ],
        applyOrder: false,
      });
      expect(setColumnasVisibles).toHaveBeenCalledWith([columnA, columnB]);
      expect(onCerrar).toHaveBeenCalled();
    });
  });
});
