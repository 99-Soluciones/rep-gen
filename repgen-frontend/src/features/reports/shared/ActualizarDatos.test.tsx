import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ActualizarDatos from "./ActualizarDatos";

const hora = (fecha: Date) =>
  new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" }).format(fecha);

describe("ActualizarDatos", () => {
  afterEach(() => vi.useRealTimers());

  it("dice de cuándo son los datos y vuelve a consultarlos", () => {
    const cargadoEn = new Date();
    const onActualizar = vi.fn();
    render(<ActualizarDatos cargadoEn={cargadoEn} estaCargando={false} onActualizar={onActualizar} />);

    const boton = screen.getByRole("button", {
      name: `Datos de las ${hora(cargadoEn)}. Actualizar datos`,
    });
    fireEvent.click(boton);
    expect(onActualizar).toHaveBeenCalledTimes(1);
  });

  it("pasados 15 minutos dice hace cuánto", () => {
    vi.useFakeTimers();
    const cargadoEn = new Date();
    render(<ActualizarDatos cargadoEn={cargadoEn} estaCargando={false} onActualizar={() => {}} />);
    expect(screen.getByRole("button")).not.toHaveTextContent("hace");

    act(() => vi.advanceTimersByTime(16 * 60_000));
    expect(screen.getByRole("button")).toHaveTextContent(`Datos de las ${hora(cargadoEn)} · hace 16 min`);
  });

  it("mientras carga sigue enfocable pero no vuelve a pedir", () => {
    const onActualizar = vi.fn();
    render(<ActualizarDatos cargadoEn={new Date()} estaCargando onActualizar={onActualizar} />);
    const boton = screen.getByRole("button", { name: "Actualizando datos" });
    expect(boton).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(boton);
    expect(onActualizar).not.toHaveBeenCalled();
  });

  it("antes de la primera carga no se muestra", () => {
    const { container } = render(
      <ActualizarDatos cargadoEn={null} estaCargando={false} onActualizar={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("después de una hora dice horas, y después de un día, días", () => {
    vi.useFakeTimers();
    render(<ActualizarDatos cargadoEn={new Date()} estaCargando={false} onActualizar={() => {}} />);
    act(() => vi.advanceTimersByTime(3 * 60 * 60_000 + 60_000));
    expect(screen.getByRole("button")).toHaveTextContent("hace 3 h");
    act(() => vi.advanceTimersByTime(24 * 60 * 60_000));
    expect(screen.getByRole("button")).toHaveTextContent("hace 1 día");
  });

  it("la primera lectura dice «Cargando datos…», no «Actualizando…»", () => {
    render(<ActualizarDatos cargadoEn={null} estaCargando onActualizar={() => {}} />);
    expect(screen.getByRole("button", { name: "Cargando datos" })).toHaveTextContent("Cargando datos…");
  });
});
