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

  // Las fechas se editan en un panel que abre el botón con el rango aplicado.
  const abrir = () => fireEvent.click(screen.getByRole("button", { name: /^Fechas:/ }));

  it("en la barra se lee el rango aplicado; al pulsarlo abre el formulario", () => {
    render(<FiltroFechas {...props} />);
    const boton = screen.getByRole("button", { name: "Fechas: del 01/01/2026 al 31/01/2026. Cambiar" });
    expect(boton).toHaveTextContent("01/01 – 31/01/2026"); // mismo año: una sola vez
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Fecha desde")).not.toBeInTheDocument();

    abrir();
    expect(boton).toHaveAttribute("aria-expanded", "true");
    // El foco entra en la primera decisión.
    expect(screen.getByLabelText("Periodo")).toHaveFocus();
  });

  it("nombra el periodo cuando el rango coincide con uno", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14));
    render(<FiltroFechas {...props} fechaDesde="2026-10-01" fechaHasta="2026-10-14" />);
    expect(screen.getByRole("button", { name: /^Fechas:/ })).toHaveTextContent(
      "Mes actual · 01/10 – 14/10/2026",
    );
    vi.useRealTimers();
  });

  it("Escape cierra sin aplicar, descarta el borrador y devuelve el foco", () => {
    render(<FiltroFechas {...props} />);
    abrir();
    fireEvent.change(screen.getByLabelText("Fecha desde"), { target: { value: "2026-01-10" } });
    fireEvent.keyDown(screen.getByLabelText("Fecha desde"), { key: "Escape" });

    expect(screen.queryByLabelText("Fecha desde")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Fechas:/ })).toHaveFocus();
    expect(props.setFechaDesde).not.toHaveBeenCalled();

    abrir();
    expect(screen.getByLabelText("Fecha desde")).toHaveValue("2026-01-01");
  });

  it("renderiza los inputs de rango de fechas", () => {
    render(<FiltroFechas {...props} />);
    abrir();

    expect(screen.getByText("Desde")).toBeInTheDocument();
    expect(screen.getByText("Hasta")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Aplicar/i }),
    ).toBeInTheDocument();
    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    expect(inputs).toHaveLength(2);
  });

  it("muestra error cuando las fechas son inválidas", () => {
    render(<FiltroFechas {...props} />);
    abrir();

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

  it("aplica fechas válidas y cierra el panel", () => {
    render(<FiltroFechas {...props} />);
    abrir();

    // El botón "Aplicar" arranca deshabilitado hasta que el borrador difiera
    // de las fechas actuales, así que hay que cambiar los inputs primero.
    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    fireEvent.change(inputs[0], { target: { value: "2026-01-05" } });
    fireEvent.change(inputs[1], { target: { value: "2026-01-20" } });
    fireEvent.click(screen.getByRole("button", { name: /Aplicar/i }));
    expect(screen.queryByLabelText("Fecha desde")).not.toBeInTheDocument();

    // Sin toast de éxito: la confirmación es la tabla recargada.
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(props.setFechaDesde).toHaveBeenCalledWith("2026-01-05");
    expect(props.setFechaHasta).toHaveBeenCalledWith("2026-01-20");
  });

  it("aplica con Enter desde un input de fecha", () => {
    render(<FiltroFechas {...props} />);
    abrir();

    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    fireEvent.change(inputs[1], { target: { value: "2026-01-15" } });
    fireEvent.submit(inputs[1]);

    expect(props.setFechaHasta).toHaveBeenCalledWith("2026-01-15");
  });

  it("un periodo llena las fechas y espera a «Aplicar», como Desde/Hasta", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14));
    render(<FiltroFechas {...props} />);
    abrir();
    const selector = screen.getByLabelText("Periodo") as HTMLSelectElement;
    expect(selector.value).toBe(""); // 01/01–31/01 no es ningún periodo: "Personalizado"

    // Recorrer opciones (p. ej. con flechas) no consulta nada todavía.
    fireEvent.change(selector, { target: { value: "mes_actual" } });
    fireEvent.change(selector, { target: { value: "mes_anterior" } });
    expect(props.setFechaDesde).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Fecha desde")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Fecha hasta")).toHaveValue("2026-09-30");
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
    abrir();
    const selector = screen.getByLabelText("Periodo") as HTMLSelectElement;
    expect(selector.value).toBe("mes_actual");

    fireEvent.change(selector, { target: { value: "" } });
    expect(screen.getByLabelText("Fecha desde")).toHaveFocus();
    expect(props.setFechaDesde).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  describe("‹ › y atajos", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 16));
    });
    afterEach(() => vi.useRealTimers());

    it("‹ desde el mes en curso aplica el mes anterior completo; › no pasa de hoy", () => {
      render(<FiltroFechas {...props} fechaDesde="2026-10-01" fechaHasta="2026-10-16" />);
      fireEvent.click(screen.getByRole("button", { name: "Periodo anterior: del 01/09/2026 al 30/09/2026" }));
      expect(props.setFechaDesde).toHaveBeenCalledWith("2026-09-01");
      expect(props.setFechaHasta).toHaveBeenCalledWith("2026-09-30");

      const siguiente = screen.getByRole("button", { name: "No hay periodo siguiente: el rango llega a hoy" });
      expect(siguiente).toHaveAttribute("aria-disabled", "true");
      vi.mocked(props.setFechaDesde).mockClear();
      fireEvent.click(siguiente);
      expect(props.setFechaDesde).not.toHaveBeenCalled();
    });

    it("Enter en Periodo aplica, y Aplicar sin cambios sigue enfocable y dice por qué", () => {
      render(<FiltroFechas {...props} fechaDesde="2026-10-01" fechaHasta="2026-10-16" />);
      fireEvent.click(screen.getByRole("button", { name: /^Fechas:/ }));
      const aplicar = screen.getByRole("button", { name: "Aplicar" });
      expect(aplicar).toHaveAttribute("aria-disabled", "true");
      expect(aplicar).toHaveAccessibleDescription("Las fechas son las que ya están cargadas.");

      const periodo = screen.getByLabelText("Periodo");
      fireEvent.change(periodo, { target: { value: "mes_anterior" } });
      fireEvent.keyDown(periodo, { key: "Enter" });
      expect(props.setFechaDesde).toHaveBeenCalledWith("2026-09-01");
    });
  });
});
