import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { type RefObject } from "react";
import TablaDinamica from "./TablaDinamica";
import type { AgGridReact } from "ag-grid-react";

vi.mock("ag-grid-react", () => ({
  AgGridReact: () => <div data-testid="ag-grid" />,
}));

describe("TablaDinamica", () => {
  const onGridListo = vi.fn();
  const referenciaGrid = {
    current: null,
  } as unknown as RefObject<AgGridReact<unknown> | null>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const contadorConTexto = (texto: string) =>
    screen.getByText((_, node) => {
      if (!node || node.tagName !== "DIV") {
        return false;
      }

      if (
        !node.classList.contains("text-sm") ||
        !node.classList.contains("text-gray-600")
      ) {
        return false;
      }

      return node.textContent?.replace(/\s+/g, " ").trim() === texto;
    });

  it("renderiza el contador de registros y la tabla mockeada", () => {
    render(
      <TablaDinamica
        referenciaGrid={referenciaGrid}
        datos={[{ id: 1 }]}
        definicionesColumnas={[{ field: "id" }]}
        estaCargando={false}
        onGridListo={onGridListo}
        filasVisibles={1}
      />,
    );

    expect(screen.getByTestId("ag-grid")).toBeInTheDocument();
    expect(contadorConTexto("1 registro")).toBeInTheDocument();
  });

  it("muestra contador en cero cuando no hay datos", () => {
    render(
      <TablaDinamica
        referenciaGrid={referenciaGrid}
        datos={[]}
        definicionesColumnas={[]}
        estaCargando={false}
        onGridListo={onGridListo}
        filasVisibles={0}
      />,
    );

    expect(contadorConTexto("0 registros")).toBeInTheDocument();
  });
});
