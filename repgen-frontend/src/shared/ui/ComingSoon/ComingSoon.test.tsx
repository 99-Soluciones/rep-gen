import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ComingSoon from './ComingSoon';

describe('ComingSoon component', () => {
  it('renders default title and message', () => {
    render(<ComingSoon />, { wrapper: MemoryRouter });
    expect(screen.getByText(/aún no está disponible/i)).toBeInTheDocument();
    expect(screen.getByText(/consultar Bancos y Ventas/i)).toBeInTheDocument();
    // Ofrece una salida concreta en vez de un callejón sin salida.
    expect(screen.getByRole('link', { name: 'Ir a Bancos' })).toHaveAttribute('href', '/bancos');
  });

  it('renders custom props', () => {
    render(
      <ComingSoon
        titulo="Próximamente"
        mensaje="Más reportes pronto"
      />,
      { wrapper: MemoryRouter },
    );
    expect(screen.getByText(/Próximamente/i)).toBeInTheDocument();
    expect(screen.getByText(/Más reportes pronto/i)).toBeInTheDocument();
  });
});
