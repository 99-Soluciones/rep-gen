import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { LineaComparacion, LineaEstado, NotaRegistros, ResultadoCompacto, SeccionEstado } from "./EstadoKpi";

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

describe("LineaComparacion", () => {
  const rango = { desde: "2026-09-01", hasta: "2026-09-15" };
  const enLista = (ui: React.ReactElement) => render(<dl>{ui}</dl>);

  it("dice el periodo anterior, su cifra y el cambio (en rojo si baja)", () => {
    enLista(
      <LineaComparacion actual={900} comparacion={{ rango, valor: 1000, estado: "lista" }} filtrado={false} />,
    );
    expect(screen.getByText("vs. 01/09 – 15/09/2026")).toBeInTheDocument();
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("· -10%")).toHaveClass("text-red-600");
  });

  it("con filtros en la tabla no compara (el periodo anterior se lee completo)", () => {
    enLista(
      <LineaComparacion actual={900} comparacion={{ rango, valor: 1000, estado: "lista" }} filtrado />,
    );
    expect(screen.getByText("Sin comparar: la tabla tiene filtros")).toBeInTheDocument();
  });

  it("dice cuando todavía calcula o no se pudo leer", () => {
    const { rerender } = enLista(
      <LineaComparacion actual={0} comparacion={{ rango, valor: null, estado: "cargando" }} filtrado={false} />,
    );
    expect(screen.getByText("Calculando…")).toBeInTheDocument();
    rerender(
      <dl>
        <LineaComparacion actual={0} comparacion={{ rango, valor: null, estado: "error" }} filtrado={false} />
      </dl>,
    );
    expect(screen.getByText("No se pudo leer")).toBeInTheDocument();
  });
});

describe("LineaEstado en otra moneda", () => {
  it("formatea con el código de la moneda, como la tabla", () => {
    render(<dl><LineaEstado etiqueta="Abonos" valor={50} codigoMoneda="USD" /></dl>);
    expect(screen.getByText(/USD\s50\.00/)).toBeInTheDocument();
  });
});
