import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { LineaEstado, NotaRegistros, ResultadoCompacto, SeccionEstado } from "./EstadoKpi";

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

  it("dice el rango y sobre cuántas filas se calculó", () => {
    const rango = { desde: "2026-09-01", hasta: "2026-09-30" };
    const { rerender } = render(<NotaRegistros registros={1} total={1} {...rango} />);
    expect(screen.getByText("01/09/2026 – 30/09/2026")).toBeInTheDocument();
    expect(screen.getByText("Calculado sobre 1 registro")).toBeInTheDocument();

    rerender(<NotaRegistros registros={12} total={1234} {...rango} />);
    expect(
      screen.getByText("Calculado sobre 12 de 1,234 registros (con los filtros de la tabla)"),
    ).toBeInTheDocument();
  });
});

describe("ResultadoCompacto", () => {
  it("adelanta la cifra resultado (en rojo si resta) y abre el resumen", () => {
    const onAbrir = vi.fn();
    render(<ResultadoCompacto etiqueta="Flujo neto" valor={-250.5} onAbrirResumen={onAbrir} />);
    expect(screen.getByText("-$250.50")).toHaveClass("text-red-600");
    fireEvent.click(screen.getByRole("button", { name: "Ver resumen" }));
    expect(onAbrir).toHaveBeenCalledTimes(1);
  });

  it("con un error no muestra una cifra", () => {
    const { container } = render(
      <ResultadoCompacto etiqueta="Flujo neto" valor={0} estado="error" onAbrirResumen={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

describe("ResultadoCompacto: lo que todavía no es una cifra", () => {
  it("antes de la primera carga muestra «—», no $0.00", () => {
    render(
      <ResultadoCompacto etiqueta="Flujo neto" valor={0} estado="primeraCarga" onAbrirResumen={() => {}} />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("dice cuando la cifra sale de filas filtradas", () => {
    render(<ResultadoCompacto etiqueta="Flujo neto" valor={100} filtrado onAbrirResumen={() => {}} />);
    expect(screen.getByText("· filtrado")).toBeInTheDocument();
  });
});
});
