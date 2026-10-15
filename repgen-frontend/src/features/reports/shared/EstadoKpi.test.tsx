import { render, screen } from "@testing-library/react";
import { LineaEstado, NotaRegistros, SeccionEstado } from "./EstadoKpi";

describe("EstadoKpi", () => {
  it("marca en rojo solo los negativos y no muestra -$0.00", () => {
    render(
      <SeccionEstado titulo="Movimientos">
        <LineaEstado etiqueta="Abonos" valor={1500} />
        <LineaEstado etiqueta="Cargos" valor={-0} />
        <LineaEstado etiqueta="Flujo neto" valor={-250.5} total />
      </SeccionEstado>,
    );

    const cifra = (etiqueta: string) =>
      screen.getByText(etiqueta).nextElementSibling as HTMLElement;

    expect(cifra("Abonos")).toHaveTextContent("$1,500.00");
    expect(cifra("Abonos")).not.toHaveClass("text-red-600");
    expect(cifra("Cargos")).toHaveTextContent(/^\$0\.00$/);
    expect(cifra("Flujo neto")).toHaveTextContent("-$250.50");
    expect(cifra("Flujo neto")).toHaveClass("text-red-600");
  });

  it("concuerda singular y plural en la nota de registros", () => {
    const { rerender } = render(<NotaRegistros registros={1} filtrado />);
    expect(screen.getByText("Calculado sobre 1 registro filtrado")).toBeInTheDocument();

    rerender(<NotaRegistros registros={1234} filtrado={false} />);
    expect(screen.getByText("Calculado sobre 1,234 registros")).toBeInTheDocument();
  });
});
