import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import TablaDinamicaControles from "./TablaDinamicaControles";
import type { FiltroDescrito } from "./describirFiltros";

const filtro = (colId: string, oculta = false): FiltroDescrito => ({
  colId,
  columna: colId === "banco" ? "Banco" : colId,
  condicion: "contiene «BBVA»",
  oculta,
});
const tres = [filtro("banco"), filtro("folio"), filtro("moneda")];

describe("TablaDinamicaControles: contador y filtros", () => {
  it("sin filtros muestra solo el total y no ofrece limpiar", () => {
    const { container } = render(<TablaDinamicaControles totalDatos={340} filasVisibles={340} />);
    // La región aria-live es la que leen los lectores de pantalla al cambiar.
    expect(container.querySelector("[aria-live]")).toHaveTextContent(/^340 registros$/);
    expect(screen.queryByRole("button", { name: "Limpiar" })).not.toBeInTheDocument();
  });

  it("con filtros dice cuántos hay y permite limpiarlos", () => {
    const onLimpiar = vi.fn();
    render(
      <TablaDinamicaControles
        totalDatos={340}
        filasVisibles={12}
        filtros={tres}
        onLimpiarFiltros={onLimpiar}
      />,
    );
    // Lo que anuncia el lector de pantalla al cambiar.
    expect(screen.getByText(/de 340/).parentElement).toHaveTextContent(
      "12 de 340 registros · 3 filtros",
    );
    expect(screen.getByRole("button", { name: "3 filtros" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(onLimpiar).toHaveBeenCalledTimes(1);
  });

  it("un filtro activo se nota aunque todavía coincidan todas las filas", () => {
    render(
      <TablaDinamicaControles
        totalDatos={340}
        filasVisibles={340}
        filtros={[filtro("banco")]}
        onLimpiarFiltros={() => {}}
      />,
    );
    expect(screen.getByText(/de 340/).parentElement).toHaveTextContent(
      "340 de 340 registros · 1 filtro",
    );
  });

  it("la lista nombra cada filtro, avisa los de columnas ocultas y quita uno", () => {
    const onQuitar = vi.fn();
    render(
      <TablaDinamicaControles
        totalDatos={340}
        filasVisibles={12}
        filtros={[filtro("banco"), filtro("folio", true)]}
        onQuitarFiltro={onQuitar}
      />,
    );
    const boton = screen.getByRole("button", { name: "2 filtros, 1 en columna oculta" });
    fireEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    const lista = screen.getByRole("list", { name: "Filtros activos" });
    expect(lista).toHaveTextContent("Banco contiene «BBVA»");
    expect(lista).toHaveTextContent("Columna oculta: el filtro aplica aunque no la veas.");

    fireEvent.click(screen.getByRole("button", { name: "Quitar filtro de Banco" }));
    expect(onQuitar).toHaveBeenCalledWith("banco");
    expect(boton).toHaveFocus();

    fireEvent.keyDown(boton, { key: "Escape" });
    expect(screen.queryByRole("list", { name: "Filtros activos" })).not.toBeInTheDocument();
  });

  it("tras un error no muestra un 0 que parezca un rango vacío", () => {
    const { container } = render(
      <TablaDinamicaControles totalDatos={0} filasVisibles={0} sinRegistros />,
    );
    expect(container.querySelector("[aria-live]")).toHaveTextContent(/^Sin registros cargados$/);
  });
});
