/* eslint-disable @typescript-eslint/no-unused-vars */
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import React from "react";
import BotonExportar from "./BotonExportar";
import type { AgGridReact } from "ag-grid-react";

const exportHandler = vi.hoisted(() => vi.fn());
const exportarDatosMock = vi.hoisted(() =>
  vi.fn((_referenciaGrid: unknown, _nombreArchivo: string) => exportHandler),
);

vi.mock("./ag-grid/exportar", () => ({
  exportarDatos: (referenciaGrid: unknown, nombreArchivo: string) => {
    exportarDatosMock(referenciaGrid, nombreArchivo);
    return () => exportHandler();
  },
}));

describe("BotonExportar", () => {
  const referenciaGrid = {
    current: { api: {} },
  } as unknown as React.RefObject<AgGridReact>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("configura la exportación con la referencia y el nombre de archivo", () => {
    render(
      <BotonExportar
        referenciaGrid={referenciaGrid}
        nombreArchivo="reporte_ventas"
      />,
    );

    expect(
      screen.getByRole("button", { name: /Exportar/i }),
    ).toBeInTheDocument();
    expect(exportarDatosMock).toHaveBeenCalledWith(
      referenciaGrid,
      "reporte_ventas",
    );
  });

  it("sin poder exportar sigue enfocable, dice por qué y no exporta", () => {
    render(
      <BotonExportar
        referenciaGrid={referenciaGrid}
        nombreArchivo="reporte_ventas"
        motivoDeshabilitado="Espera a que terminen de cargar los registros"
      />,
    );
    const boton = screen.getByRole("button", { name: /Exportar/i });
    expect(boton).toHaveAttribute("aria-disabled", "true");
    expect(boton).not.toBeDisabled();
    expect(boton).toHaveAccessibleDescription("Espera a que terminen de cargar los registros");

    boton.focus();
    expect(boton).toHaveFocus();
    fireEvent.click(boton);
    expect(exportHandler).not.toHaveBeenCalled();
  });

  it("invoca el handler de exportación al hacer click", () => {
    render(
      <BotonExportar
        referenciaGrid={referenciaGrid}
        nombreArchivo="reporte_ventas"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Exportar/i }));

    expect(exportHandler).toHaveBeenCalledTimes(1);
  });
});
