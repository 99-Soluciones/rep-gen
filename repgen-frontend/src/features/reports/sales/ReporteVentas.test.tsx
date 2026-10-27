import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const obtenerReporteMock = vi.hoisted(() => vi.fn());
const filtrosMock = vi.hoisted(() =>
  vi.fn<(props: Record<string, unknown>) => React.ReactElement>(() => (
    <div data-testid="filtros-ventas" />
  )),
);

type TablaMockProps = {
  referenciaGrid: React.RefObject<{
    api?: {
      getColumns: () => Array<{ id: string }>;
      getFilterModel: () => Record<string, unknown>;
      isDestroyed: () => boolean;
      getDisplayedRowCount: () => number;
      forEachNodeAfterFilter: (
        cb: (node: { data: { facturaGranTotalMxn?: number } }) => void,
      ) => void;
    };
  }>;
  onGridListo: (event: { api: { getColumns: () => Array<{ id: string }> } & typeof eventosGrid }) => void;
  onActualizacionModulo?: () => void;
  estaCargando: boolean;
};

// Lo que useReporteGrid usa del grid al quedar listo (suscripción + foto de la vista).
const eventosGrid = vi.hoisted(() => ({
  addEventListener: () => {},
  isDestroyed: () => false,
  getColumnState: () => [],
  getFilterModel: () => ({}),
}));

const tablaMock = vi.hoisted(() => vi.fn((props: TablaMockProps) => {
  // Mantenemos siempre las últimas props en una ref para evitar agregarlas
  // como dependencia del useEffect (lo que causaría un bucle infinito de renders).
  const propsRef = React.useRef(props);
  propsRef.current = props;

  React.useEffect(() => {
    const currentProps = propsRef.current;
    currentProps.referenciaGrid.current = {
      api: {
        getColumns: () => [{ id: 'col-1' }],
        getFilterModel: () => ({ estado: 'activo' }),
        isDestroyed: () => false,
        getDisplayedRowCount: () => 2,
        forEachNodeAfterFilter: (cb: (node: { data: { facturaGranTotalMxn?: number } }) => void) => {
          cb({ data: { facturaGranTotalMxn: 120 } });
          cb({ data: { facturaGranTotalMxn: 80 } });
        },
      },
    };
    currentProps.onGridListo({ api: { getColumns: () => [{ id: 'col-1' }], ...eventosGrid } });
    currentProps.onActualizacionModulo?.();
    // Solo se ejecuta una vez al montar el mock.
  }, []);

  return <div data-testid="tabla-ventas" />;
}));

vi.mock('../shared/api/reportes.api', () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

vi.mock('../shared/EncabezadoReporte', () => ({
  default: (props: Record<string, unknown>) => filtrosMock(props),
}));

vi.mock('../shared/TablaDinamica/TablaDinamica', () => ({
  default: (props: TablaMockProps) => tablaMock(props),
}));

vi.mock('ag-grid-react', () => ({
  AgGridReact: vi.fn(),
}));

vi.mock('../shared/column-labels/useColumnLabels', () => ({
  useColumnLabels: () => ({
    labels: {
      cliente: {
        clasificacion1: 'CANAL',
        clasificacion2: '',
        clasificacion3: '',
        clasificacion4: '',
      },
      articulo: {
        categoria1: 'LÍNEA',
        categoria2: '',
        categoria3: '',
        categoria4: '',
      },
    },
    isLoading: false,
    error: null,
    getLabel: (slot: string) => {
      const map: Record<string, string> = {
        'cliente.clasificacion1': 'CANAL',
        'articulo.categoria1': 'LÍNEA',
      };
      return map[slot];
    },
    refreshLabels: vi.fn(),
  }),
}));

vi.mock('./columnas', () => ({
  construirColumnasVentas: () => [{ field: 'total' as string, colId: 'total' }],
}));

vi.mock('../../../shared/utils/fechas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../shared/utils/fechas')>()),
  obtenerFechaHoyFormateada: () => '2026-05-08',
  obtenerPrimerDiaDelMes: () => '2026-05-01',
}));

import ReporteVentas from './ReporteVentas';

describe('ReporteVentas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerReporteMock.mockResolvedValue([]);
  });

  it('renderiza filtros y tabla y consulta el endpoint de ventas', async () => {
    render(
      <MemoryRouter>
        <ReporteVentas reportType="facturas" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalled(), { timeout: 500 });
    expect(screen.getByTestId('filtros-ventas')).toBeInTheDocument();
    expect(screen.getByTestId('tabla-ventas')).toBeInTheDocument();

    expect(obtenerReporteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'ventas/buscar',
        rangoFechas: { fechaInicio: '2026-05-01', fechaFin: '2026-05-08' },
      }),
    );
    expect(filtrosMock).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: 'Reporte de Ventas',
      }),
    );
    expect(tablaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        datos: [],
        estaCargando: false,
      }),
    );

    // El botón de exportar viaja en el slot `accionesToolbarFin` de la tabla
    // con el nombre de archivo correcto.
    const ultimaLlamada = tablaMock.mock.calls.at(-1)?.[0] as {
      accionesToolbarFin?: { props?: { nombreArchivo?: string } };
    };
    expect(ultimaLlamada.accionesToolbarFin?.props?.nombreArchivo).toMatch(
      /^reporte_ventas_facturas_\d{4}-\d{2}-\d{2}_a_\d{4}-\d{2}-\d{2}$/,
    );

    // El filtro de columna de ag-grid se aplica localmente y no debe
    // generar una nueva solicitud al servidor.
    await new Promise((resolve) => setTimeout(resolve, 400));
    // Dos consultas: el rango y el periodo anterior (comparación del resumen).
    expect(obtenerReporteMock).toHaveBeenCalledTimes(2);
    expect(obtenerReporteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'ventas/buscar',
        rangoFechas: { fechaInicio: '2026-04-01', fechaFin: '2026-04-08' },
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByText((_, node) =>
          Boolean(
            node?.tagName === 'DD' &&
              /200\.00/.test(node.textContent ?? '') &&
              node.previousElementSibling?.textContent === 'Facturación bruta',
          ),
        ),
      ).toBeInTheDocument(),
    );

    // El toggle del panel de métricas ahora vive en PanelKpiLateral (no en
    // Filtros). Hay dos botones de colapso (desktop sobre la línea divisoria
    // y móvil en el header); ambos disparan el mismo onToggle.
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Ocultar resumen' })[0],
    );
    expect(
      screen.getAllByRole('button', { name: 'Mostrar resumen' }).length,
    ).toBeGreaterThan(0);
  });

  it('usa endpoint y archivo de conceptos cuando aplica', async () => {
    render(
      <MemoryRouter>
        <ReporteVentas reportType="conceptos" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalled(), { timeout: 500 });

    expect(obtenerReporteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'ventas-por-concepto/buscar',
      }),
    );
    const ultimaLlamada = tablaMock.mock.calls.at(-1)?.[0] as {
      accionesToolbarFin?: { props?: { nombreArchivo?: string } };
    };
    expect(ultimaLlamada.accionesToolbarFin?.props?.nombreArchivo).toMatch(
      /^reporte_ventas_conceptos_\d{4}-\d{2}-\d{2}_a_\d{4}-\d{2}-\d{2}$/,
    );
  });
});
