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

const toastMock = vi.hoisted(() => vi.fn());
vi.mock("react-hot-toast", () => ({ default: toastMock }));

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

  it("el clic sin poder exportar dice por qué, en vez de no hacer nada", () => {
    render(
      <BotonExportar
        referenciaGrid={referenciaGrid}
        nombreArchivo="reporte"
        motivoDeshabilitado="No hay registros que exportar con estas fechas y filtros"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Exportar/ }));
    expect(toastMock).toHaveBeenCalledWith(
      "No hay registros que exportar con estas fechas y filtros",
      { id: "exportar-deshabilitado" },
    );
    expect(exportHandler).not.toHaveBeenCalled();
  });

  it("su nombre accesible es solo «Exportar CSV»; lo que descarga va como descripción", () => {
    render(<BotonExportar referenciaGrid={referenciaGrid} nombreArchivo="reporte" />);
    const boton = screen.getByRole("button", { name: "Exportar CSV" });
    expect(boton).toHaveAccessibleDescription(
      "Descarga las filas filtradas con las columnas visibles, sin la fila de totales. Se abre en Excel.",
    );
  });
});
