/* eslint-disable @typescript-eslint/no-unused-vars */
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import React from "react";
import AccionesTabla from "./AccionesTabla";
import type { AgGridReact } from "ag-grid-react";

const modalColumnasMock = vi.hoisted(() =>
  vi.fn((_props: Record<string, unknown>) => <div data-testid="modal-columnas" />),
);
const configuracionesColumnasMock = vi.hoisted(() =>
  vi.fn((_props: Record<string, unknown>) => (
    <div data-testid="configuraciones-columnas" />
  )),
);
const tenantFeaturesMock = vi.hoisted(() =>
  vi.fn(() => ({ habilitarConfiguraciones: true })),
);

vi.mock("./ModalColumnas", () => ({
  default: (props: Record<string, unknown>) => modalColumnasMock(props),
}));

const montajesVistas = vi.hoisted(() => ({ total: 0 }));

vi.mock("./ConfiguracionesColumnas/ConfiguracionesColumnas", () => {
  const ConfiguracionesColumnasFalso = (props: Record<string, unknown>) => {
    // Cuenta montajes (no renders): un key distinto recrea el selector.
    React.useState(() => {
      montajesVistas.total += 1;
      return null;
    });
    return configuracionesColumnasMock(props);
  };
  return { default: ConfiguracionesColumnasFalso };
});

vi.mock("./useTenantFeatures", () => ({
  useTenantFeatures: () => tenantFeaturesMock(),
}));

describe("AccionesTabla", () => {
  const referenciaGrid = {
    current: { api: {} },
  } as unknown as React.RefObject<AgGridReact>;

  const props = {
    referenciaGrid,
    columnasVisibles: [],
    setColumnasVisibles: vi.fn(),
    reportId: "ventas_facturas",
    configs: [],
    onConfigsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tenantFeaturesMock.mockReturnValue({ habilitarConfiguraciones: true });
  });

  it("renderiza columnas y configuraciones", () => {
    render(<AccionesTabla {...props} />);

    expect(
      screen.getByRole("button", { name: /Columnas/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("modal-columnas")).toBeInTheDocument();
    expect(screen.getByTestId("configuraciones-columnas")).toBeInTheDocument();
    expect(configuracionesColumnasMock).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: "ventas_facturas" }),
    );
    expect(modalColumnasMock).toHaveBeenCalledWith(
      expect.objectContaining({ abierto: false }),
    );
  });

  it("abre el modal de columnas al hacer click", () => {
    render(<AccionesTabla {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /Columnas/i }));

    expect(modalColumnasMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ abierto: true }),
    );
  });

  it("oculta configuraciones cuando el tenant no las habilita", () => {
    tenantFeaturesMock.mockReturnValue({ habilitarConfiguraciones: false });

    render(<AccionesTabla {...props} />);

    expect(
      screen.queryByTestId("configuraciones-columnas"),
    ).not.toBeInTheDocument();
  });

  it("cada reporte (Facturas / Conceptos) tiene su propio selector de vistas", () => {
    const { rerender } = render(<AccionesTabla {...props} reportId="ventas_facturas" />);
    const antes = montajesVistas.total;
    rerender(<AccionesTabla {...props} reportId="ventas_facturas" />);
    expect(montajesVistas.total).toBe(antes);
    rerender(<AccionesTabla {...props} reportId="ventas_conceptos" />);
    expect(montajesVistas.total).toBe(antes + 1);
  });
});
