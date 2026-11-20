import { vi } from "vitest";
import React from "react";

const obtenerReporteMock = vi.hoisted(() => vi.fn());
const encabezadoMock = vi.hoisted(() =>
  vi.fn<(props: Record<string, unknown>) => React.ReactElement>(() => (
    <div data-testid="encabezado-compras" />
  )),
);

type FilaMock = {
  compraId: number;
  tipoDeConcepto: string;
  articuloGranTotalMxn: number;
  facturaGranTotalMxn: number;
  facturaSaldoActual: number;
};
type TablaMockProps = {
  referenciaGrid: React.RefObject<unknown>;
  definicionesColumnas: Array<{ field?: string }>;
  totales: { unaVezPor?: { campos: string[] } };
  onGridListo: (event: unknown) => void;
  onActualizacionModulo?: () => void;
};

// Lo que useReporteGrid usa del grid al quedar listo.
const eventosGrid = vi.hoisted(() => ({
  addEventListener: () => {},
  isDestroyed: () => false,
  getColumnState: () => [],
  getFilterModel: () => ({}),
}));

// Dos conceptos de la misma compra (factura de 1,000 sin pagar) y un gasto liquidado.
const FILAS: FilaMock[] = [
  { compraId: 1, tipoDeConcepto: "Stock", articuloGranTotalMxn: 600, facturaGranTotalMxn: 1000, facturaSaldoActual: 1000 },
  { compraId: 1, tipoDeConcepto: "Stock", articuloGranTotalMxn: 400, facturaGranTotalMxn: 1000, facturaSaldoActual: 1000 },
  { compraId: 2, tipoDeConcepto: "Gasto", articuloGranTotalMxn: 250, facturaGranTotalMxn: 250, facturaSaldoActual: 0 },
];

const tablaMock = vi.hoisted(() =>
  vi.fn((props: TablaMockProps) => {
    const propsRef = React.useRef(props);
    propsRef.current = props;

    React.useEffect(() => {
      const actuales = propsRef.current;
      (actuales.referenciaGrid as { current: unknown }).current = {
        api: {
          getColumns: () => [{ id: "col-1" }],
          getFilterModel: () => ({}),
          isDestroyed: () => false,
          getDisplayedRowCount: () => FILAS.length,
          forEachNodeAfterFilter: (cb: (node: { data: FilaMock }) => void) =>
            FILAS.forEach((data) => cb({ data })),
        },
      };
      actuales.onGridListo({ api: { getColumns: () => [{ id: "col-1" }], ...eventosGrid } });
      actuales.onActualizacionModulo?.();
    }, []);

    return <div data-testid="tabla-compras" />;
  }),
);

// Todos los mocks antes de cualquier import del código bajo prueba.
vi.mock("../shared/api/reportes.api", () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

vi.mock("../shared/EncabezadoReporte", () => ({
  default: (props: Record<string, unknown>) => encabezadoMock(props),
}));

vi.mock("../shared/TablaDinamica/TablaDinamica", () => ({
  default: (props: TablaMockProps) => tablaMock(props),
}));

vi.mock("ag-grid-react", () => ({
  AgGridReact: vi.fn(),
}));

vi.mock("../shared/column-labels/useColumnLabels", () => ({
  useColumnLabels: () => ({ getLabel: () => undefined }),
}));

vi.mock("../../../shared/utils/fechas", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../shared/utils/fechas")>()),
  obtenerFechaHoyFormateada: () => "2026-10-31",
  obtenerPrimerDiaDelMes: () => "2026-10-01",
}));

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReporteComprasConceptos from "./ReporteComprasConceptos";

const ultimaTabla = () => tablaMock.mock.calls[tablaMock.mock.calls.length - 1][0];

describe("ReporteComprasConceptos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerReporteMock.mockResolvedValue([]);
  });

  it("consulta su endpoint con el rango y resume el gran total, por tipo y por compra", async () => {
    render(
      <MemoryRouter>
        <ReporteComprasConceptos />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "compras-conceptos/buscar",
          rangoFechas: { fechaInicio: "2026-10-01", fechaFin: "2026-10-31" },
        }),
      ),
    );
    expect(encabezadoMock).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Reporte de Compras" }),
    );
    expect(ultimaTabla().definicionesColumnas).toHaveLength(44);
    expect(ultimaTabla().totales.unaVezPor?.campos).toEqual([
      "facturaGranTotalMxn",
      "facturaSaldoActual",
    ]);

    // Resultado: 600 + 400 + 250. Facturas una vez por compra: 1,000 + 250; saldo 1,000.
    await waitFor(() => expect(screen.getAllByText(/1,250\.00/).length).toBeGreaterThan(0));
    expect(screen.getByText("Stock")).toBeDefined();
    expect(screen.getByText("Gasto")).toBeDefined();
    expect(screen.getByText("Saldo por pagar")).toBeDefined();
  });
});
