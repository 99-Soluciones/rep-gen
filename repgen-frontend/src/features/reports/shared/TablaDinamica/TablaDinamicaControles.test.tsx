import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import TablaDinamicaControles from "./TablaDinamicaControles";

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
        filtrosActivos={3}
        onLimpiarFiltros={onLimpiar}
      />,
    );
    expect(screen.getByText(/de 340/).parentElement).toHaveTextContent(
      "12 de 340 registros · 3 filtros",
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(onLimpiar).toHaveBeenCalledTimes(1);
  });

  it("un filtro activo se nota aunque todavía coincidan todas las filas", () => {
    render(
      <TablaDinamicaControles
        totalDatos={340}
        filasVisibles={340}
        filtrosActivos={1}
        onLimpiarFiltros={() => {}}
      />,
    );
    expect(screen.getByText(/de 340/).parentElement).toHaveTextContent(
      "340 de 340 registros · 1 filtro",
    );
  });
});
