import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import DrawerFiltros from './DrawerFiltros';

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: toastMock,
}));

describe('DrawerFiltros', () => {
  const onCerrar = vi.fn();
  const setFechaDesde = vi.fn();
  const setFechaHasta = vi.fn();
  const setPaginaActual = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el panel cuando está abierto', () => {
    render(
      <DrawerFiltros
        abierto
        onCerrar={onCerrar}
        fechaDesde="2026-01-01"
        setFechaDesde={setFechaDesde}
        fechaHasta="2026-01-31"
        setFechaHasta={setFechaHasta}
        setPaginaActual={setPaginaActual}
      />,
    );

    expect(screen.getByText('Filtros del Reporte')).toBeInTheDocument();
    expect(screen.getByText('Aplicar Fechas')).toBeInTheDocument();
  });

  it('muestra error cuando las fechas son inválidas', () => {
    render(
      <DrawerFiltros
        abierto
        onCerrar={onCerrar}
        fechaDesde="2026-01-01"
        setFechaDesde={setFechaDesde}
        fechaHasta="2026-01-31"
        setFechaHasta={setFechaHasta}
        setPaginaActual={setPaginaActual}
      />,
    );

    const inputs = screen.getAllByDisplayValue(/2026-01-/);
    fireEvent.change(inputs[0], { target: { value: '2026-02-10' } });
    fireEvent.change(inputs[1], { target: { value: '2026-02-01' } });
    fireEvent.click(screen.getByText('Aplicar Fechas'));

    expect(toastMock.error).toHaveBeenCalledWith(
      'La fecha de inicio no puede ser posterior a la fecha de fin.',
    );
    expect(setFechaDesde).not.toHaveBeenCalled();
  });

  it('aplica fechas válidas y cierra', () => {
    render(
      <DrawerFiltros
        abierto
        onCerrar={onCerrar}
        fechaDesde="2026-01-01"
        setFechaDesde={setFechaDesde}
        fechaHasta="2026-01-31"
        setFechaHasta={setFechaHasta}
        setPaginaActual={setPaginaActual}
      />,
    );

    fireEvent.click(screen.getByText('Aplicar Fechas'));

    expect(toastMock.success).toHaveBeenCalledWith('Fechas aplicadas');
    expect(setFechaDesde).toHaveBeenCalledWith('2026-01-01');
    expect(setFechaHasta).toHaveBeenCalledWith('2026-01-31');
    expect(setPaginaActual).toHaveBeenCalledWith(1);
    expect(onCerrar).toHaveBeenCalled();
  });
});
