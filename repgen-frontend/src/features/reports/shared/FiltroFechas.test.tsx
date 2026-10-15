import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import FiltroFechas from "./FiltroFechas";

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: toastMock,
}));

describe("FiltroFechas", () => {
  const props = {
    fechaDesde: "2026-01-01",
    setFechaDesde: vi.fn(),
    fechaHasta: "2026-01-31",
    setFechaHasta: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza los inputs de rango de fechas", () => {
    render(<FiltroFechas {...props} />);

    expect(screen.getByText("Desde:")).toBeInTheDocument();
    expect(screen.getByText("Hasta:")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Aplicar/i }),
    ).toBeInTheDocument();
    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    expect(inputs).toHaveLength(2);
  });

  it("muestra error cuando las fechas son inválidas", () => {
    render(<FiltroFechas {...props} />);

    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    fireEvent.change(inputs[0], { target: { value: "2026-02-10" } });
    fireEvent.change(inputs[1], { target: { value: "2026-02-01" } });
    fireEvent.click(screen.getByRole("button", { name: /Aplicar/i }));

    // El error queda junto a los campos, se anuncia y se asocia a ambos inputs.
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La fecha «Desde» no puede ser posterior a «Hasta».",
    );
    for (const input of inputs) {
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", "fechas-error");
    }
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(props.setFechaDesde).not.toHaveBeenCalled();

    // Al corregir una fecha, el error desaparece.
    fireEvent.change(inputs[0], { target: { value: "2026-01-15" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("aplica fechas válidas", () => {
    render(<FiltroFechas {...props} />);

    // El botón "Aplicar" arranca deshabilitado hasta que el borrador difiera
    // de las fechas actuales, así que hay que cambiar los inputs primero.
    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    fireEvent.change(inputs[0], { target: { value: "2026-01-05" } });
    fireEvent.change(inputs[1], { target: { value: "2026-01-20" } });
    // Mientras el borrador difiere, se indica qué rango sigue en la tabla.
    expect(
      screen.getByText("Sin aplicar · la tabla muestra 01/01/2026 – 31/01/2026"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Aplicar/i }));

    // Sin toast de éxito: la confirmación es la tabla recargada.
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(props.setFechaDesde).toHaveBeenCalledWith("2026-01-05");
    expect(props.setFechaHasta).toHaveBeenCalledWith("2026-01-20");
  });

  it("aplica con Enter desde un input de fecha", () => {
    render(<FiltroFechas {...props} />);

    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    fireEvent.change(inputs[1], { target: { value: "2026-01-15" } });
    fireEvent.submit(inputs[1]);

    expect(props.setFechaHasta).toHaveBeenCalledWith("2026-01-15");
  });

  it("un periodo llena las fechas y espera a «Aplicar», como Desde/Hasta", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14));
    render(<FiltroFechas {...props} />);
    const selector = screen.getByLabelText("Periodo:") as HTMLSelectElement;
    expect(selector.value).toBe(""); // 01/01–31/01 no es ningún periodo: "Personalizado"

    // Recorrer opciones (p. ej. con flechas) no consulta nada todavía.
    fireEvent.change(selector, { target: { value: "mes_actual" } });
    fireEvent.change(selector, { target: { value: "mes_anterior" } });
    expect(props.setFechaDesde).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Fecha desde")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Fecha hasta")).toHaveValue("2026-09-30");
    expect(screen.getByText(/Sin aplicar/)).toBeInTheDocument();
    expect(selector.value).toBe("mes_anterior");

    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(props.setFechaDesde).toHaveBeenCalledWith("2026-09-01");
    expect(props.setFechaHasta).toHaveBeenCalledWith("2026-09-30");
    vi.useRealTimers();
  });

  it("«Personalizado» lleva el foco a la fecha Desde", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14));
    render(<FiltroFechas {...props} fechaDesde="2026-10-01" fechaHasta="2026-10-14" />);
    const selector = screen.getByLabelText("Periodo:") as HTMLSelectElement;
    expect(selector.value).toBe("mes_actual");

    fireEvent.change(selector, { target: { value: "" } });
    expect(screen.getByLabelText("Fecha desde")).toHaveFocus();
    expect(props.setFechaDesde).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
