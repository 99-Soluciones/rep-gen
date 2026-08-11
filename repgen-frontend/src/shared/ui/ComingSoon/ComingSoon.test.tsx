import { render, screen } from '@testing-library/react';
import ComingSoon from './ComingSoon';

describe('ComingSoon component', () => {
  it('renders default title and message', () => {
    render(<ComingSoon />);
    expect(screen.getByText(/Reporte en Desarrollo/i)).toBeInTheDocument();
    expect(screen.getByText(/Estamos trabajando intensamente/i)).toBeInTheDocument();
  });

  it('renders custom props', () => {
    render(
      <ComingSoon
        titulo="Próximamente"
        mensaje="Más reportes pronto"
        icono="zap"
      />,
    );
    expect(screen.getByText(/Próximamente/i)).toBeInTheDocument();
    expect(screen.getByText(/Más reportes pronto/i)).toBeInTheDocument();
  });
});
