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

    expect(toastMock.error).toHaveBeenCalledWith(
      "La fecha de inicio no puede ser posterior a la fecha de fin.",
    );
    expect(props.setFechaDesde).not.toHaveBeenCalled();
  });

  it("aplica fechas válidas", () => {
    render(<FiltroFechas {...props} />);

    // El botón "Aplicar" arranca deshabilitado hasta que el borrador difiera
    // de las fechas actuales, así que hay que cambiar los inputs primero.
    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    fireEvent.change(inputs[0], { target: { value: "2026-01-05" } });
    fireEvent.change(inputs[1], { target: { value: "2026-01-20" } });
    fireEvent.click(screen.getByRole("button", { name: /Aplicar/i }));

    expect(toastMock.success).toHaveBeenCalledWith("Fechas aplicadas");
    expect(props.setFechaDesde).toHaveBeenCalledWith("2026-01-05");
    expect(props.setFechaHasta).toHaveBeenCalledWith("2026-01-20");
  });
});
